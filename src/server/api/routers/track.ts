import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { accessCheck, providersCheck } from "@/server/api/routers/access";
import { env } from "process";
import { getPublicUrl } from "@/utils/url";
import { slugify } from "@/utils/string";

export const trackRouter = createTRPCRouter({
  getMyTracks: protectedProcedure
    .input(
      z.object({
        project: z.string().min(1).max(64),
      })
    )
    .query(async ({ ctx, input }) => {
      const access = await accessCheck(ctx);

      const project = await ctx.db.project.findFirst({
        where: {
          username: {
            equals: input.project,
            mode: "insensitive",
          },
        },
      });

      if (!project || (project.status === "DRAFT" && access !== "ADMIN")) {
        return [];
      }

      const tracks = await ctx.db.track.findMany({
        where: {
          projectId: project.id,
        },
      });

      return tracks.map(track => ({
        username: track.username,
        title: track.title,
        description: track.description,
        musicStatus: track.musicStatus,
        visualStatus: track.visualStatus,
      }));
    }),

  createTrack: protectedProcedure
    .input(
      z.object({
        project: z.string().min(1).max(64),
        username: z.string().min(1).max(64).optional(),
        title: z.string().min(1).max(64),
        description: z.string().min(1).max(1024).optional(),
        explicit: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const access = await accessCheck(ctx);

      const project = await ctx.db.project.findFirst({
        where: {
          username: {
            equals: input.project,
            mode: "insensitive",
          },
        },
      });

      if (!project || (project.status === "DRAFT" && access !== "ADMIN")) {
        throw new Error("Project not found.");
      }

      let username = input.username;

      if (username) {
        const usernameFind = await ctx.db.project.findFirst({
          where: {
            username: {
              equals: input.username,
              mode: "insensitive",
            },
          },
        });

        if (usernameFind) {
          throw new Error("Slug already exists.");
        }

        if (input.username && !/^\w{1,64}$/.test(input.username)) {
          throw new Error(
            "Slug can only contain letters, numbers, and underscores."
          );
        }
      } else {
        const usernameCheck = slugify(input.title).slice(0, 64) || "_";

        let index = 1;

        do {
          const usernameCheckWithIndex =
            index < 2 ? usernameCheck : usernameCheck + index;

          const usernameFind = await ctx.db.track.findFirst({
            where: {
              username: {
                equals: usernameCheckWithIndex,
                mode: "insensitive",
              },
            },
          });

          if (!usernameFind) {
            username = usernameCheckWithIndex;
            break;
          }

          index++;
        } while (index < 10);
      }

      if (!username) {
        throw new Error("Could not generate a slug.");
      }

      const profile = await ctx.db.profile.findUnique({
        where: {
          userId: ctx.session.user.id,
        },
      });

      if (!profile) {
        throw new Error("Profile not found.");
      }

      const providers = await providersCheck(ctx);

      const discordProvider = providers?.find(p => p.provider === "discord");

      if (!discordProvider) {
        throw new Error("Discord not connected.");
      }

      let discordChannelId;

      if (project.discordChannelId) {
        if (
          project.discordChannelType !== 0 &&
          project.discordChannelType !== 15
        ) {
          throw new Error("Invalid Discord channel type.");
        }

        const messageContent = {
          content: `<@${discordProvider.providerAccountId}> created a new track!`,
          embeds: [
            {
              title: input.title,
              description: input.description,
              color: 0x171717,
              fields: [
                {
                  name: "Track Manager",
                  value: `[${profile.name} \(@${profile.username}\)](${getPublicUrl()}/@${profile.username})\n<@${discordProvider.providerAccountId}>`,
                },
              ],
            },
          ],
          components: [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  label: "View Track",
                  style: 5,
                  url: `${getPublicUrl()}/dashboard/projects/${project.username}/tracks/${username}`,
                },
              ],
            },
          ],
        };

        const request = await fetch(
          "https://discord.com/api/v10/channels/" +
            project.discordChannelId +
            "/threads",
          {
            method: "POST",
            headers: {
              Authorization: `Bot ${env.DISCORD_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: input.title,
              type: 11,
              topic: input.description,
              parent_id: project.discordChannelId,
              message:
                project.discordChannelType === 15 ? messageContent : undefined,
            }),
          }
        );

        if (!request.ok) {
          throw new Error("Could not create Discord thread.");
        }

        const response = (await request.json()) as {
          id: string;
        };

        discordChannelId = response.id;

        if (project.discordChannelType !== 15) {
          const messageRequest = await fetch(
            "https://discord.com/api/v10/channels/" +
              discordChannelId +
              "/messages",
            {
              method: "POST",
              headers: {
                Authorization: `Bot ${env.DISCORD_TOKEN}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(messageContent),
            }
          );

          if (!messageRequest.ok) {
            throw new Error("Could not send Discord message.");
          }
        }
      }

      const track = await ctx.db.track.create({
        data: {
          projectId: project.id,
          username: username,
          title: input.title,
          description: input.description,
          discordChannelId: discordChannelId,
          musicStatus: "IDEA",
          visualStatus: "SEARCHING",
          explicit: input.explicit,
        },
      });

      await ctx.db.trackAuditLog.create({
        data: {
          trackId: track.id,
          userId: ctx.session.user.id,
          action: "CREATE_TRACK",
          value: track,
        },
      });

      const invite = await ctx.db.trackCollaborator.create({
        data: {
          trackId: track.id,
          userId: ctx.session.user.id,
          acceptedInvite: true,
          role: "MANAGER",
        },
      });

      await ctx.db.trackAuditLog.create({
        data: {
          trackId: track.id,
          userId: ctx.session.user.id,
          targetUserId: ctx.session.user.id,
          action: "CREATE_COLLABORATOR",
          value: {
            ...invite,
            acceptedInvite: false,
          },
        },
      });

      await ctx.db.trackAuditLog.create({
        data: {
          trackId: track.id,
          userId: ctx.session.user.id,
          action: "ACCEPT_COLLABORATOR_INVITE",
          value: invite,
          oldValue: {
            ...invite,
            acceptedInvite: false,
          },
        },
      });

      return { username: username };
    }),

  getTrack: protectedProcedure
    .input(
      z.object({
        username: z.string().min(1).max(64),
      })
    )
    .query(async ({ ctx, input }) => {
      const access = await accessCheck(ctx);

      const track = await ctx.db.track.findFirst({
        where: {
          username: {
            equals: input.username,
            mode: "insensitive",
          },
        },
        include: {
          project: true,
          collaborators: {
            include: {
              user: {
                include: {
                  profile: true,
                },
              },
            },
          },
        },
      });

      if (!track || (track.project.status === "DRAFT" && access !== "ADMIN")) {
        return null;
      }

      let myRole: "MANAGER" | "EDITOR" | "CONTRIBUTOR" | "VIEWER" = "VIEWER";
      let myAcceptedInvite;
      let myId;

      const collaborators = (
        await Promise.all(
          track.collaborators.map(async collaborator => {
            if (collaborator.user?.profile) {
              if (collaborator.user.profile.userId === ctx.session.user.id) {
                myRole = collaborator.role;
                myAcceptedInvite = collaborator.acceptedInvite;
                myId = collaborator.id;
              }

              return {
                type: "ATRIARCHY" as const,
                id: collaborator.id,
                username: collaborator.user.profile.username,
                name: collaborator.user.profile.name,
                role: collaborator.role,
                acceptedInvite: collaborator.acceptedInvite,
                avatar: collaborator.user.image,
                me: collaborator.user.profile.userId === ctx.session.user.id,
              };
            }

            if (collaborator.discordUserId) {
              return {
                type: "DISCORD" as const,
                id: collaborator.id,
                discord: {
                  userId: collaborator.discordUserId,
                  username: collaborator.discordUsername,
                  avatar: collaborator.discordAvatar,
                },
                role: collaborator.role,
                acceptedInvite: collaborator.acceptedInvite,
              };
            }

            await ctx.db.trackCollaborator.delete({
              where: {
                id: collaborator.id,
              },
            });

            return null;
          })
        )
      )
        .filter(c => c !== null)
        .sort((a, b) => {
          if (a.role === b.role) return 0;
          if (a.role === "MANAGER") return -1;
          if (b.role === "MANAGER") return 1;
          if (a.role === "EDITOR") return -1;
          if (b.role === "EDITOR") return 1;
          if (a.role === "CONTRIBUTOR") return -1;
          if (b.role === "CONTRIBUTOR") return 1;
          if (a.role === "VIEWER") return -1;
          if (b.role === "VIEWER") return 1;
          return 0;
        });

      const manager = collaborators.find(c => c.role === "MANAGER");

      return {
        username: track.username,
        title: track.title,
        description: track.description,
        explicit: track.explicit,
        musicStatus: track.musicStatus,
        visualStatus: track.visualStatus,
        project: {
          username: track.project.username,
          title: track.project.title,
          description: track.project.description,
        },
        collaborators: collaborators,
        me: {
          role: myRole as "MANAGER" | "EDITOR" | "CONTRIBUTOR" | "VIEWER",
          acceptedInvite: myAcceptedInvite,
          id: myId,
        },
        manager: manager,
      };
    }),

  updateTrack: protectedProcedure
    .input(
      z.object({
        username: z.string().min(1).max(64),
        title: z.string().min(1).max(64),
        description: z.string().min(1).max(1024).optional(),
        explicit: z.boolean(),
        musicStatus: z.enum([
          "IDEA",
          "DEMO",
          "WRITING",
          "PRODUCTION",
          "RECORDING",
          "MIX_MASTER",
          "ABANDONED",
          "FINISHED",
        ]),
        visualStatus: z.enum([
          "SEARCHING",
          "CONCEPT",
          "WORKING",
          "POLISHING",
          "ABANDONED",
          "FINISHED",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const access = await accessCheck(ctx);

      const track = await ctx.db.track.findFirst({
        where: {
          username: {
            equals: input.username,
            mode: "insensitive",
          },
        },
        include: {
          project: true,
          collaborators: {
            include: {
              user: {
                include: {
                  profile: true,
                },
              },
            },
          },
        },
      });

      if (!track || (track.project.status === "DRAFT" && access !== "ADMIN")) {
        throw new Error("Track not found.");
      }

      const newData = await ctx.db.track.update({
        where: { id: track.id },
        data: {
          title: input.title,
          description: input.description,
          musicStatus: input.musicStatus,
          visualStatus: input.visualStatus,
        },
      });

      await ctx.db.trackAuditLog.create({
        data: {
          trackId: track.id,
          userId: ctx.session.user.id,
          action: "UPDATE_TRACK",
          oldValue: track,
          value: newData,
        },
      });
    }),
});