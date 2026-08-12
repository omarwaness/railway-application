import { Command } from "commander";

import { api } from "../lib/api";
import { confirm, PromptCancelled, promptText, select } from "../lib/prompt";

/** What the service is built from. Railway takes one source, or none. */
type SourceKind = "empty" | "repo" | "image";

interface CreateOptions {
    name?: string;
    empty?: boolean;
    repo?: string;
    image?: string;
    branch?: string;
}

/** The half of `serviceCreate` worth printing back. */
interface CreatedService {
    service: {
        id: string;
        name: string;
        projectId: string;
    };
}

/** The `source` field of the create payload — absent for an empty service. */
type Source = { repo: string } | { image: string } | undefined;

const SOURCE_CHOICES = [
    { value: "empty", label: "Empty service", hint: "no source, deploy later" },
    { value: "repo", label: "GitHub repo", hint: "builds from a branch" },
    { value: "image", label: "Docker image", hint: "runs a published image" },
] as const satisfies { value: SourceKind; label: string; hint: string }[];

/** Flags win over the menu, so `rw service create <id> --empty` stays scriptable. */
function kindFromFlags(options: CreateOptions): SourceKind | null {
    if (options.empty) return "empty";
    if (options.repo) return "repo";
    if (options.image) return "image";
    return null;
}

async function askRequired(question: string, missing: string): Promise<string> {
    const value = await promptText(question);
    if (!value) throw new Error(missing);
    return value;
}

/**
 * Resolves what the service is built from, prompting only for what the flags
 * didn't already answer.
 */
async function resolveSource(options: CreateOptions): Promise<Source> {
    const kind =
        kindFromFlags(options) ??
        (await select("What should this service run?", [...SOURCE_CHOICES],
            "No source given. Pass --empty, --repo <owner/repo> or --image <image>.",
        ));

    switch (kind) {
        case "empty":
            return undefined;

        case "repo": {
            const repo =
                options.repo ??
                (await askRequired("GitHub repo (owner/repo): ", "A repo is required."));
            return { repo };
        }

        case "image": {
            const image =
                options.image ??
                (await askRequired("Docker image (e.g. nginx:latest): ", "An image is required."));
            return { image };
        }
    }
}

async function runCreate(projectId: string, options: CreateOptions) {
    const source = await resolveSource(options);

    // `branch` only means something alongside a repo; the server rejects the
    // pairing outright, so it's dropped here instead of being sent to fail.
    const branch = source && "repo" in source ? options.branch : undefined;

    const { service } = await api<CreatedService>("/services", {
        method: "POST",
        body: {
            projectId,
            ...(options.name ? { name: options.name } : {}),
            ...(source ? { source } : {}),
            ...(branch ? { branch } : {}),
        },
    });

    const from = source
        ? "repo" in source
            ? ` from ${source.repo}`
            : ` from ${source.image}`
        : " (empty)";

    console.log(`Created service ${service.name}${from}`);
    console.log(`  id: ${service.id}`);
}

interface DeleteOptions {
    service?: string;
    yes?: boolean;
}

/**
 * A service as the project overview lists it. The row describes a service
 * *instance*, so `serviceId` — not `id` — is what the delete route takes.
 */
interface ServiceRow {
    serviceId: string;
    serviceName: string;
    service: { deletedAt: string | null } | null;
    latestDeployment: { status: string } | null;
}

/** The half of `GET /projects/:id` this command reads. */
interface ProjectOverview {
    project: { id: string; name: string };
    primaryEnvironment: { name: string; services: ServiceRow[] } | null;
}

/** Resolves `--service` against a name or an id, insisting on exactly one hit. */
function matchService(services: ServiceRow[], wanted: string): ServiceRow {
    const needle = wanted.toLowerCase();
    const matches = services.filter(
        (row) =>
            row.serviceId.toLowerCase() === needle ||
            row.serviceName.toLowerCase() === needle,
    );

    const [match] = matches;

    if (!match) {
        const names = services.map((row) => row.serviceName).join(", ");
        throw new Error(`No service called "${wanted}" in this project.\nFound: ${names}`);
    }

    if (matches.length > 1) {
        // Railway allows duplicate names, so the id is the only way through.
        const ids = matches.map((row) => row.serviceId).join(", ");
        throw new Error(
            `More than one service is called "${wanted}". Pass an id instead: ${ids}`,
        );
    }

    return match;
}

async function runDelete(projectId: string, options: DeleteOptions) {
    const overview = await api<ProjectOverview>(
        `/projects/${encodeURIComponent(projectId)}`,
    );

    // The overview only carries the primary environment's services. A service
    // that exists nowhere else can't be listed here — but deleting one removes
    // it from every environment regardless.
    const environment = overview.primaryEnvironment;

    // Soft-deleted services keep coming back with `deletedAt` set; they're
    // already gone as far as this command is concerned.
    const services = (environment?.services ?? []).filter(
        (row) => !row.service?.deletedAt,
    );

    if (services.length === 0) {
        console.log(`No services in ${overview.project.name}.`);
        return;
    }

    const target = options.service
        ? matchService(services, options.service)
        : await select(
            `Which service should be deleted? (${overview.project.name}/${environment?.name})`,
            services.map((row) => ({
                value: row,
                label: row.serviceName,
                hint: row.latestDeployment?.status.toLowerCase() ?? "no deployments",
            })),
            "No service given. Pass --service <name|id>.",
        );

    if (!options.yes) {
        console.log(
            `Deleting ${target.serviceName} removes it from every environment,` +
            " along with its deployments, variables and domains. This can't be undone.",
        );

        if (!(await confirm(`Delete ${target.serviceName}?`))) {
            console.log("Nothing deleted.");
            return;
        }
    }

    await api<{ deleted: true }>(`/services/${encodeURIComponent(target.serviceId)}`, {
        method: "DELETE",
    });

    console.log(`Deleted ${target.serviceName}.`);
}

export function serviceCommand(): Command {
    const service = new Command("service").description("work with services");

    service
        .command("create")
        .description("create a service in a project")
        .argument("<projectId>", "project the service belongs to")
        .option("-n, --name <name>", "service name; Railway picks one when omitted")
        .option("--empty", "create with no source")
        .option("--repo <owner/repo>", "build from a GitHub repo")
        .option("--image <image>", "run a Docker image")
        .option("-b, --branch <branch>", "branch to build, with --repo")
        .action(async (projectId: string, options: CreateOptions) => {
            if ([options.empty, options.repo, options.image].filter(Boolean).length > 1) {
                throw new Error("Pass only one of --empty, --repo or --image.");
            }

            await cancellable(() => runCreate(projectId, options));
        });

    service
        .command("delete")
        .description("delete a service from a project")
        .argument("<projectId>", "project to list services from")
        .option("-s, --service <name|id>", "service to delete; prompted for when omitted")
        .option("-y, --yes", "skip the confirmation")
        .action(async (projectId: string, options: DeleteOptions) => {
            await cancellable(() => runDelete(projectId, options));
        });

    return service;
}

/** Turns a ctrl-c out of a prompt into the exit code a shell expects. */
async function cancellable(action: () => Promise<void>): Promise<void> {
    try {
        await action();
    } catch (error) {
        if (error instanceof PromptCancelled) {
            process.exitCode = 130;
            return;
        }

        throw error;
    }
}
