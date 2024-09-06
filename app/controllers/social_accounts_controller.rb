class SocialAccountsController < ApplicationController
  include UserScoped

  def new
    @social_account = @user.social_accounts.new

    render turbo_stream: turbo_stream.append(
      "social_accounts",
      partial: "social_accounts/form",
      locals: { social_account: @social_account }
    )
  end

  def index
    @social_accounts = @user.social_accounts
  end

  def show
    @social_account = @user.social_accounts.find(params[:id])
  end
end
