# Setup

This is the development setup process. For production use the Dockerfile and env.

- [How to setup Ruby on Rails](https://gorails.com/setup/windows/11)

```sh
git clone https://github.com/dylhack/trackboard.git
cd trackboard
bin/setup
# Setup your .env!
cp .env.example .env
# Create an admin account
ruby script/addadmin.rb
bin/dev
```

