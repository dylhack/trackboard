# Setup

This is the development setup process. For production use the Dockerfile and env.

- [How to setup Ruby on Rails](https://gorails.com/setup/windows/11)

```sh
git clone https://github.com/dylhack/trackboard.git
cd trackboard
bin/setup
bin/rails db:seed
# Create an admin account
bin/ruby script/addadmin.rb
# Setup your .env!
cp .env.example .env
bin/dev
```

