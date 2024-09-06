require "application_system_test_case"

class SocialAccountsTest < ApplicationSystemTestCase
  setup do
    @social_account = social_accounts(:one)
  end

  test "visiting the index" do
    visit social_accounts_url
    assert_selector "h1", text: "Social accounts"
  end

  test "should create social account" do
    visit social_accounts_url
    click_on "New social account"

    click_on "Create Social account"

    assert_text "Social account was successfully created"
    click_on "Back"
  end

  test "should update Social account" do
    visit social_account_url(@social_account)
    click_on "Edit this social account", match: :first

    click_on "Update Social account"

    assert_text "Social account was successfully updated"
    click_on "Back"
  end

  test "should destroy Social account" do
    visit social_account_url(@social_account)
    click_on "Destroy this social account", match: :first

    assert_text "Social account was successfully destroyed"
  end
end
