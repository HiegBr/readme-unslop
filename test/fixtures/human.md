# tinydiff

I got tired of waiting for `git diff` on a 2GB monorepo, so this prints a diff of two directories
by comparing file sizes and mtimes first and hashing only if those disagree.

## Install

    cargo install tinydiff

## Use

    tinydiff old/ new/

On my laptop it takes 0.4s on a 200k file tree where `diff -r` takes 41s. It does not
follow symlinks yet (see #12).

## Tests

`cargo test`. The fixtures in `tests/` are tiny directory trees checked into git.

MIT.
