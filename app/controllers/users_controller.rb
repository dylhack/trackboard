class UsersController < ApplicationController
  before_action :set_user, only: %i[ show edit update destroy ]
  before_action :require_admin, except: %i[ index show edit update ]
  before_action :require_ownership, only: %i[ edit update destroy ]

  def index
    @users = User.all
  end

  def show
  end

  def new
    @user = User.new
  end

  def edit
  end

  def create
    @user = User.new(user_params)
    upsert_social_accounts

    respond_to do |format|
      if @user.save
        format.html { redirect_to user_url(@user), notice: "User was successfully created." }
        format.json { render :show, status: :created, location: @user }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @user.errors, status: :unprocessable_entity }
      end
    end
  end

  def update
    upsert_social_accounts
    respond_to do |format|
      if @user.update(user_params)
        format.html { redirect_to user_url(@user), notice: "User was successfully updated." }
        format.json { render :show, status: :ok, location: @user }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @user.errors, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @user.destroy!

    respond_to do |format|
      format.html { redirect_to users_url, notice: "User was successfully destroyed." }
      format.json { head :no_content }
    end
  end

  private
    def set_user
      @user = User.find(params[:id])
    end

    def require_ownership
      return if Current.user.admin? || @user.me?

      redirect_back fallback_location: root_path, notice: t("session.unauthorized")
    end

    def upsert_social_accounts
      return nil if social_account_params.empty?

      social_account_params.each do |data|
        if data[:id] == "new"
          @user.social_accounts.new(link: data[:link])
          next
        end

        social_account = @user.social_accounts.find(data[:id])
        if data[:link].blank?
          social_account.destroy!
        else
          social_account.link = data[:link]
        end
      end
    end

    def user_params
      params.require(:user).permit(:name, :discord_id, :role, :avatar).tap do |p|
        p.delete(:role) unless Current.user.admin?
        p.delete?(:discord_id) unless Current.user.admin?
      end
    end

    def social_account_params
      return @social_account_params if defined? @social_account_params

      @social_account_params = []
      social_accounts = params[:social_accounts] || []
      social_accounts.each do |data|
        next if data[:id].nil? && data[:link].blank?

        @social_account_params << {
          id: data[:id] || "new",
          link: data[:link]
        }
      end

      @social_account_params
    end
end
