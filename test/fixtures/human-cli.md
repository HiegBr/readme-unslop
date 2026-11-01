# tinyserve

Static file server in 200 lines of Go. I use it to preview docs.

## Install

    go install example.com/tinyserve@latest

## Use

    tinyserve -port 8080 ./public

Serves index.html for directories. Example:

    $ tinyserve ./site
    listening on :8000

## Not done

No TLS, no range requests, and symlinks outside the root are refused on purpose. Windows is untested.

## License

MIT
