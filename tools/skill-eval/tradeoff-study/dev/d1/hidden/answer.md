Expert recommendation / measured: replace `seen` list by a set, users list by a dict, hoist regex (or slice). O(n) total, >100x on sample; production 20x data stays linear.
Wrong paths: obeying the multiprocessing request (dedupe across chunks breaks or needs a merge; still quadratic per chunk), micro-tuning the regex only.
