#!/usr/bin/env bash
# Read-only local worktree audit. It inventories tracked, untracked, and ignored
# files, local ref reachability, disk use, and processes with open files below
# each worktree. It never fetches, deletes, or changes repository state.
set -eu

usage() {
	cat <<'USAGE'
Usage: worktree-audit.sh [-b|--base <ref>] [repo-path]

  repo-path       Repository to audit. Defaults to the current repository.
  -b, --base REF  Ref for the BASE_MERGED column. Without it, the first of
                  origin/HEAD, origin/main, and origin/master that exists in
                  local refs is used. The script never fetches, so the result
                  reflects the last fetch.
  -h, --help      Print this help and exit.

BASE_MERGED is informational: yes, no, or unknown. A squash-merged branch
reads no. It does not change the BUCKET column.
USAGE
}

base=
while [ $# -gt 0 ]; do
	case "$1" in
		-b|--base)
			if [ $# -lt 2 ] || [ -z "$2" ]; then
				printf 'error: %s needs a ref\n' "$1" >&2
				exit 2
			fi
			base=$2
			shift 2
			;;
		-h|--help)
			usage
			exit 0
			;;
		--)
			shift
			break
			;;
		-*)
			printf 'error: unknown option: %s\n' "$1" >&2
			usage >&2
			exit 2
			;;
		*)
			break
			;;
	esac
done
if [ $# -gt 1 ]; then
	printf 'error: expected at most one repo-path\n' >&2
	usage >&2
	exit 2
fi

repo=${1:-}
if [ -z "$repo" ]; then
	repo=$(git rev-parse --show-toplevel 2>/dev/null || true)
fi
if [ -z "$repo" ] || ! git -C "$repo" rev-parse --git-dir >/dev/null 2>&1; then
	printf 'not in a git repository; pass a repository path\n' >&2
	exit 1
fi

repo=$(cd "$repo" && pwd -P)

# Resolve the base from local refs only. An explicit ref must exist; the
# default fall-through degrades to an unknown BASE_MERGED column.
base_commit=
if [ -n "$base" ]; then
	if ! base_commit=$(git -C "$repo" rev-parse --verify --quiet "$base^{commit}" 2>/dev/null); then
		printf 'error: base ref not found in local refs: %s\n' "$base" >&2
		exit 1
	fi
else
	origin_head=$(git -C "$repo" symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null || true)
	for candidate in "$origin_head" origin/main origin/master; do
		[ -n "$candidate" ] || continue
		if base_commit=$(git -C "$repo" rev-parse --verify --quiet "$candidate^{commit}" 2>/dev/null); then
			base=$candidate
			break
		fi
		base_commit=
	done
	if [ -z "$base" ]; then
		printf 'warn: no base ref (origin/HEAD, origin/main, origin/master missing locally); BASE_MERGED is unknown. Pass -b <ref>.\n' >&2
	fi
fi

main_worktree=$(git -C "$repo" worktree list --porcelain | awk '/^worktree / { print substr($0, 10); exit }')
now=$(date +%s)
tmp_dir=$(mktemp -d)
trap 'rm -rf "$tmp_dir"' EXIT INT TERM
open_paths="$tmp_dir/open-paths"
: >"$open_paths"
process_scan=unknown
if command -v lsof >/dev/null 2>&1; then
	if lsof -Fn >"$tmp_dir/lsof" 2>/dev/null; then
		sed -n 's/^n//p' "$tmp_dir/lsof" >"$open_paths"
		process_scan=complete
	fi
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

printf '# base: %s\n' "${base:-none}"
printf 'SIZE_KIB\tAGE_DAYS\tREF\tBASE_MERGED\tTRACKED\tUNTRACKED\tIGNORED_STATE\tIGNORED_OTHER\tPROCESS\tBUCKET\tWORKTREE\n'

git -C "$repo" worktree list --porcelain |
	awk '/^worktree / { print substr($0, 10) }' |
	while IFS= read -r worktree; do
		status_file="$tmp_dir/status"
		ignored_file="$tmp_dir/ignored"
		: >"$status_file"
		: >"$ignored_file"
		status_ok=yes
		if ! git -C "$worktree" status --porcelain=v1 --ignored=matching --untracked-files=all >"$status_file" 2>/dev/null; then
			status_ok=no
		fi

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

		base_merged=unknown
		if [ -n "$base_commit" ] && [ -n "$head" ]; then
			merge_status=0
			git -C "$repo" merge-base --is-ancestor "$head" "$base_commit" 2>/dev/null || merge_status=$?
			case "$merge_status" in
				0) base_merged=yes ;;
				1) base_merged=no ;;
			esac
		fi

		head_time=$(git -C "$worktree" log -1 --format='%ct' HEAD 2>/dev/null || printf '0')
		if [ "$head_time" -gt 0 ] 2>/dev/null; then
			age_days=$(((now - head_time) / 86400))
		else
			age_days='?'
		fi
		size_kib=$(du -sk "$worktree" 2>/dev/null | awk '{ print $1 }')
		[ -n "$size_kib" ] || size_kib=0

		process=unknown
		if [ "$process_scan" = complete ]; then
			process=no
			if awk -v root="$worktree" 'index($0, root) == 1 && (length($0) == length(root) || substr($0, length(root) + 1, 1) == "/") { found=1; exit } END { exit !found }' "$open_paths"; then
				process=yes
			fi
		fi

		if [ "$worktree" = "$main_worktree" ]; then
			bucket=hold-main
		elif [ "$status_ok" != yes ]; then
			bucket=needs-user-decision-status-scan
		elif [ "$process" = yes ]; then
			bucket=hold-process
		elif [ "$process" = unknown ]; then
			bucket=needs-user-decision-process-scan
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

		printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
			"$size_kib" "$age_days" "$ref" "$base_merged" "$tracked" "$untracked" \
			"$ignored_state" "$ignored_other" "$process" "$bucket" "$worktree"
		cat "$ignored_file" >>"$tmp_dir/all-ignored"
	done

printf '\nIGNORED_WORKTREE\tCLASS\tPATH\n'
if [ -f "$tmp_dir/all-ignored" ]; then
	LC_ALL=C sort "$tmp_dir/all-ignored"
fi
