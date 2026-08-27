#!/usr/bin/env bash
# Read-only local worktree audit. It inventories tracked, untracked, and ignored
# files, local ref reachability, disk use, and processes with open files below
# each worktree. It never fetches, deletes, or changes repository state.
#
# Usage: worktree-audit.sh [repo-path]
set -eu

repo=${1:-}
if [ -z "$repo" ]; then
	repo=$(git rev-parse --show-toplevel 2>/dev/null || true)
fi
if [ -z "$repo" ] || ! git -C "$repo" rev-parse --git-dir >/dev/null 2>&1; then
	printf 'not in a git repository; pass a repository path\n' >&2
	exit 1
fi

repo=$(cd "$repo" && pwd -P)
main_worktree=$(git -C "$repo" worktree list --porcelain | awk '/^worktree / { print substr($0, 10); exit }')
now=$(date +%s)
tmp_dir=$(mktemp -d)
trap 'rm -rf "$tmp_dir"' EXIT INT TERM
active_dirs="$tmp_dir/active-dirs"
: >"$active_dirs"
if command -v lsof >/dev/null 2>&1; then
	lsof -Fn -a -d cwd 2>/dev/null | sed -n 's/^n//p' >"$active_dirs" || true
fi

classify_ignored_path() {
	path=$1
	case "$path" in
		.env|.env.*|.envrc|.dev.vars|.netrc|.npmrc|.pypirc|*.pem|*.key|*.p12|*.pfx|*.jks|*.keystore|*.mobileprovision|*.provisionprofile|*credential*|*secret*|*token*|*auth*|*session*|*keychain*|*.db|*.db-*|*.sqlite|*.sqlite-*|*.realm|data/|*/data/|*/data/*|uploads/|*/uploads/|*/uploads/*|profile/|*/profile/|*/profile/*|storage/|*/storage/|*/storage/*)
			printf 'state'
			;;
		*)
			printf 'generated'
			;;
	esac
}

printf 'SIZE_KIB\tAGE_DAYS\tREF\tTRACKED\tUNTRACKED\tIGNORED_STATE\tIGNORED_OTHER\tPROCESS\tBUCKET\tWORKTREE\n'

git -C "$repo" worktree list --porcelain |
	awk '/^worktree / { print substr($0, 10) }' |
	while IFS= read -r worktree; do
		status_file="$tmp_dir/status"
		ignored_file="$tmp_dir/ignored"
		: >"$status_file"
		: >"$ignored_file"
		git -C "$worktree" status --porcelain=v1 --ignored=matching --untracked-files=all >"$status_file" 2>/dev/null || true

		tracked=0
		untracked=0
		ignored_state=0
		ignored_other=0
		while IFS= read -r line; do
			code=${line:0:2}
			path=${line:3}
			case "$code" in
				'!!')
					kind=$(classify_ignored_path "$path")
					if [ "$kind" = state ]; then
						ignored_state=$((ignored_state + 1))
					else
						ignored_other=$((ignored_other + 1))
					fi
					printf '%s\t%s\t%s\n' "$worktree" "$kind" "$path" >>"$ignored_file"
					;;
				'??') untracked=$((untracked + 1)) ;;
				*) tracked=$((tracked + 1)) ;;
			esac
		done <"$status_file"

		head=$(git -C "$worktree" rev-parse HEAD 2>/dev/null || true)
		ref=$(git -C "$worktree" symbolic-ref --quiet --short HEAD 2>/dev/null || true)
		if [ -z "$ref" ] && [ -n "$head" ]; then
			ref=$(git -C "$repo" for-each-ref --format='%(refname:short)' --contains "$head" refs/heads refs/remotes 2>/dev/null | LC_ALL=C sort | head -1)
		fi
		[ -n "$ref" ] || ref=unrecoverable-detached

		head_time=$(git -C "$worktree" log -1 --format='%ct' HEAD 2>/dev/null || printf '0')
		if [ "$head_time" -gt 0 ] 2>/dev/null; then
			age_days=$(((now - head_time) / 86400))
		else
			age_days='?'
		fi
		size_kib=$(du -sk "$worktree" 2>/dev/null | awk '{ print $1 }')
		[ -n "$size_kib" ] || size_kib=0

		process=no
		if awk -v root="$worktree" 'index($0, root) == 1 && (length($0) == length(root) || substr($0, length(root) + 1, 1) == "/") { found=1; exit } END { exit !found }' "$active_dirs"; then
			process=yes
		fi

		if [ "$worktree" = "$main_worktree" ]; then
			bucket=hold-main
		elif [ "$process" = yes ]; then
			bucket=hold-process
		elif [ "$tracked" -gt 0 ] || [ "$untracked" -gt 0 ]; then
			bucket=hold-local-work
		elif [ "$ignored_state" -gt 0 ]; then
			bucket=hold-ignored-state
		elif [ "$ignored_other" -gt 0 ]; then
			bucket=needs-user-decision-ignored
		elif [ "$ref" = unrecoverable-detached ]; then
			bucket=needs-user-decision-detached
		else
			bucket=candidate
		fi

		printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
			"$size_kib" "$age_days" "$ref" "$tracked" "$untracked" \
			"$ignored_state" "$ignored_other" "$process" "$bucket" "$worktree"
		cat "$ignored_file" >>"$tmp_dir/all-ignored"
	done

printf '\nIGNORED_WORKTREE\tCLASS\tPATH\n'
if [ -f "$tmp_dir/all-ignored" ]; then
	LC_ALL=C sort "$tmp_dir/all-ignored"
fi
