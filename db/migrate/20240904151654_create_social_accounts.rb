class CreateSocialAccounts < ActiveRecord::Migration[8.0]
  def change
    create_table :social_accounts do |t|
      t.belongs_to :user, null: false, foreign_key: true
      t.string :link, null: false

      t.timestamps
    end
  end
end
