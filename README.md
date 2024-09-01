# README

This README would normally document whatever steps are necessary to get the
application up and running.

# Requirements

- Ruby >= 3.3.0
- SQLite3
- Ruby Vips

# Setup

This is the development setup process. For production use the Dockerfile.

```sh
git clone https://github.com/dylhack/trackboard.git
bin/setup
# Setup your .env!
cp .env.example .env
# Create an admin account
ruby script/addadmin.rb
bin/dev
```

