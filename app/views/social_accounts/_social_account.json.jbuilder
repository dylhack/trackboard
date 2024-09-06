json.id social_account.id
json.href social_account.link
json.user_id social_account.user_id
json.user_path user_url(social_account.user_id, format: :json)
json.url user_social_account_url(social_account.user_id, social_account.id, format: :json)
json.extract! social_account, :created_at, :updated_at
