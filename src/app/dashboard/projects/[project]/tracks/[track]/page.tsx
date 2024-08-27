import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import { Sidebar } from "@/app/_components/sidebar";
import { InviteBanner } from "@/app/_components/invite-banner";
import { EditTrack } from "@/app/_components/edit-track";

export default async function InfoPage({
  params,
}: {
  params: { project: string; track: string };
}) {
  const session = await getServerAuthSession();

  if (!session) {
    return redirect("/");
  }

  const onboarding = await api.profile.getOnboarding();

  if (!onboarding) {
    return redirect("/dashboard/onboarding");
  }

  const track = await api.track.getTrack({ username: params.track });

  if (!track) {
    return (
      <HydrateClient>
        <main className="h-dvh w-dvw bg-neutral-900 text-gray-200">
          <div className="flex h-full w-full items-start justify-center">
            <Sidebar />
            <div className="flex h-full w-full grow flex-col items-start justify-start gap-4 overflow-y-auto p-4">
              <h1 className="bg-gradient-to-br from-purple-500 to-violet-500 bg-clip-text text-3xl font-bold text-transparent">
                Track not found.
              </h1>
            </div>
          </div>
        </main>
      </HydrateClient>
    );
  }

  return (
    <HydrateClient>
      <main className="h-dvh w-dvw bg-neutral-900 text-gray-200">
        <div className="flex h-full w-full items-start justify-center">
          <Sidebar
            selected="PROJECTS_TRACKS_INFO"
            project={{
              title: track.project.title,
              username: track.project.username,
            }}
            track={{
              title: track.title,
              username: track.username,
              access: track.me.role,
            }}
          />
          <div className="flex h-full w-full grow flex-col items-start justify-start gap-4 overflow-y-auto p-4">
            {
              <div className="mb-8 flex flex-col items-start justify-start gap-2">
                <h1 className="bg-gradient-to-br from-purple-500 to-violet-500 bg-clip-text text-3xl font-bold text-transparent">
                  {track.title}
                </h1>
                {track.description && (
                  <p className="text-lg">{track.description}</p>
                )}
                {track.manager && (
                  <span className="text-sm text-gray-400">
                    Project Lead:{" "}
                    {track.manager.type === "ATRIARCHY"
                      ? `${track.manager.name} (@${track.manager.username})`
                      : `${track.manager.discord.username} (Discord)`}
                  </span>
                )}
              </div>
            }
            {track.me.role !== "VIEWER" && !track.me.acceptedInvite && (
              <InviteBanner username={track.username} />
            )}
            <EditTrack
              username={track.username}
              title={track.title}
              description={track.description}
              explicit={track.explicit}
              musicStatus={track.musicStatus}
              visualStatus={track.visualStatus}
            />
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}