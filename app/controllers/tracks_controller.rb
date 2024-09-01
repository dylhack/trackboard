class TracksController < ApplicationController
  include ProjectScoped
  before_action :require_admin, except: [ :index, :show ]
  before_action :set_track, only: %i[ show edit update destroy ]

  def index
    respond_to do |format|
      format.html { redirect_to project_url(@project) }
      format.json {
        @tracks = @project.tracks
        render :index
      }
    end
  end

  def show
  end

  def new
    @track = @project.tracks.new(user: Current.user)
  end

  def edit
  end

  def create
    @track = @project.tracks.new(track_params)

    respond_to do |format|
      if @track.save
        format.html { redirect_to project_url(@project), notice: "Track was successfully created." }
        format.json { render :show, status: :created, location: @track }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @track.errors, status: :unprocessable_entity }
      end
    end
  end

  def update
    respond_to do |format|
      if @track.update(track_params)
        format.html { redirect_to project_url(@project), notice: "Track was successfully updated." }
        format.json { render :show, status: :ok, location: @track }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @track.errors, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @track.destroy!

    respond_to do |format|
      format.html { redirect_to project_url(@project), notice: "Track was successfully destroyed." }
      format.json { head :no_content }
    end
  end

  private
    def set_track
      @track = @project.tracks.find(params[:id])
    end

    def track_params
      params.require(:track).permit(:name, :description, :status, :slug, :song_type).tap do |p|
        p[:user] = Current.user
      end
    end
end
