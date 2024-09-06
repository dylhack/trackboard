require "test_helper"

class SocialAccountsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @social_account = social_accounts(:one)
  end

  test "should get index" do
    get social_accounts_url
    assert_response :success
  end

  test "should get new" do
    get new_social_account_url
    assert_response :success
  end

  test "should create social_account" do
    assert_difference("SocialAccount.count") do
      post social_accounts_url, params: { social_account: {} }
    end

    assert_redirected_to social_account_url(SocialAccount.last)
  end

  test "should show social_account" do
    get social_account_url(@social_account)
    assert_response :success
  end

  test "should get edit" do
    get edit_social_account_url(@social_account)
    assert_response :success
  end

  test "should update social_account" do
    patch social_account_url(@social_account), params: { social_account: {} }
    assert_redirected_to social_account_url(@social_account)
  end

  test "should destroy social_account" do
    assert_difference("SocialAccount.count", -1) do
      delete social_account_url(@social_account)
    end

    assert_redirected_to social_accounts_url
  end
end
