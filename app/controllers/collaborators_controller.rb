class CollaboratorsController < ApplicationController
  include ProjectScoped
  include TrackScoped
  before_action :set_collaborator, only: %i[ show edit update destroy ]

  def index
    @collaborators = @track.collaborators.all
  end

  def show
  end

  def new
    @collaborator = @track.collaborators.new
  end

  def edit
  end

  def create
    @collaborator = @track.collaborators.new(collaborator_params)

    respond_to do |format|
      if @collaborator.save
        format.html { redirect_to collaborator_url(@collaborator), notice: "Collaborator was successfully created." }
        format.json { render :show, status: :created, location: @collaborator }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @collaborator.errors, status: :unprocessable_entity }
      end
    end
  end

  def update
    respond_to do |format|
      if @collaborator.update(collaborator_params)
        format.html { redirect_to collaborator_url(@collaborator), notice: "Collaborator was successfully updated." }
        format.json { render :show, status: :ok, location: @collaborator }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @collaborator.errors, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @collaborator.destroy!

    respond_to do |format|
      format.html { redirect_to collaborators_url, notice: "Collaborator was successfully destroyed." }
      format.json { head :no_content }
    end
  end

  private
    def set_collaborator
      @collaborator = @track.collaborators.find(params[:id])
    end

    def collaborator_params
      params.require(:collaborator).permit(:track_id, :user_id)
    end
end
