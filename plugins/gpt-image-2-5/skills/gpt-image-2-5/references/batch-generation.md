# Batch generation

Apply the route and model checks in the main skill before preparing the queue. Tune throughput using the requested assets. Generate extra test images only when the user requests them.

## Prepare and dispatch

1. Assign each requested image a unique asset ID and output path. Inspect its references and save its exact prompt before dispatch. Give each worker disjoint asset IDs. Use multiple agents only when the session authorizes them.
2. Start with a small number of active requests. After several completions, increase concurrency by one and compare completed images per wall-clock minute, request latency, and errors. Keep the fastest tested setup that sustains successful completions.
3. Refill each free worker immediately. Avoid waiting for an entire batch to finish. Where the tools allow it, use a bounded sequential loop over the prepared queue to reduce gaps between model turns, file operations, and requests.
4. If concurrent calls within one worker complete in sequence, keep one request active per worker. More pending promises may increase waiting time without improving throughput. Compare actual completion timestamps before adding concurrency.
5. Save each artifact and manifest as it completes, then inspect saved images in small groups. Resume from verified outputs. Finish only when every requested ID has an inspected artifact or an explicit failure record.

Record each attempt in a local JSONL log, including the asset ID, attempt number, worker ID, dispatch and completion times in UTC, elapsed seconds from a monotonic clock, target concurrency, observed in-flight count, outcome, any error and `Retry-After`, and returned artifact path or ID. Keep request latency separate from total collection time so preparation and dispatch gaps remain visible. Use one log per worker if concurrent writes could conflict.

## Rate limits and uncertain failures

On a rate-limit response, pause new requests across all workers sharing the account. Honor `Retry-After` when supplied. Otherwise use bounded exponential backoff with jitter, for example 30, 60, then 120 seconds plus a small random delay. Halve concurrency, with a minimum of one, before retrying. Keep waits interruptible and tell the user when a cooldown delays progress.

A quota or reset response requires waiting until requests are allowed again. Stop repeated attempts while access is unavailable. Do not create accounts, change routes, or launch extra workers to evade a limit. The account's weekly coding-usage percentage is not an image quota or a requests-per-minute allowance.

After a timeout or uncertain failure, inspect returned events and existing artifacts before retrying. Generation can succeed before saving or inspection fails. Recover a matching artifact when possible, preserving its source and avoiding a duplicate request.

Report the fastest tested configuration, its observed throughput, latency, and error count. Zero rate-limit responses establishes only that the tested workload succeeded. It does not reveal how close it came to a limit.

## Review the collection

- Run the inspector with `--pixels` and retain its evidence in each manifest. It decodes alpha and records transparent, partially transparent, near-opaque, and opaque pixel counts; a channel alone does not establish transparency. An object whose alpha is mostly 253 out of 255 is nearly opaque. Requiring every object pixel to equal 255 would misclassify it.
- Compare the raw alpha bounding box with a thresholded box, such as alpha greater than 8. State the threshold. Faint pixels with alpha 1 can enlarge the raw box; inspect visible edges before classifying them as stray marks or cropping.
- Measure actual dimensions and padding. A square-canvas prompt does not guarantee a particular pixel size, and requested percentage padding is approximate. Record deviations against the app's requirements.
- Compare per-image and total bytes with the original collection before integrating app assets. Report the size increase and check any known delivery budget; source bytes alone do not establish the final compressed app or download size.
- Review subjects, palettes, framing, and readability at the intended display size. Compare old and new artwork at equal display sizes. Read-only pixel inspection is separate from image editing; use the image tool for corrections unless the user authorizes programmatic edits.

## Observations from a native-tool run

On 2026-09-19, a collection run produced 55 new badges without generation failures or rate-limit responses. Three independent workers with one active request each took about 25-42 seconds per request. Five measured pairs of concurrent calls within those workers completed at 35.6-40.2 seconds and 68.2-78.8 seconds from their shared dispatch time. This suggests serialization within a worker, but does not prove where queuing occurs. Doubling pending calls did not improve production speed.

Four independent workers retained single-request latency of 32.5-41.3 seconds. Four was the highest tested independent concurrency and the available agent ceiling. The service ceiling remains unknown. Treat four as the fastest tested setup for that run, not a guaranteed optimum. The account's weekly coding-usage reading remained at 27 percent and supplied no image-quota evidence.

The tool consistently returned 1254-by-1254 PNGs in that run. Several images fell short of requested 8 percent padding without clipping; alpha values around 253 and faint edge pixels were common. These are inspection examples, not output guarantees.
