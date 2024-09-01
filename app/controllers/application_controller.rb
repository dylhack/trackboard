class ApplicationController < ActionController::Base
  include Authentication

  unless Rails.env.development?
    # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
    allow_browser versions: :modern
  end
end
