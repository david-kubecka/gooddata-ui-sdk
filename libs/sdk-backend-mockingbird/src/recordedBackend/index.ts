// (C) 2019 GoodData Corporation

import {
    AnalyticalBackendConfig,
    AuthenticatedPrincipal,
    IAnalyticalBackend,
    IAnalyticalWorkspace,
    IAuthenticationProvider,
    IElementQueryFactory,
    IExecutionFactory,
    IWorkspaceMetadata,
    IWorkspaceSettingsService,
    IWorkspaceStylingService,
    NotSupported,
    UnexpectedResponseError,
} from "@gooddata/sdk-backend-spi";
import { RecordedExecutionFactory } from "./execution";
import { RecordingIndex, WorkspaceRecordings } from "./types";

const defaultConfig = { hostname: "test" };

/**
 * Creates new backend that will be providing recorded results to the caller. The recorded results are provided
 * to the backend in the form of RecordingIndex. This contains categorized recordings for the different service
 * calls.
 *
 * Note that:
 * - the 'tools/mock-handling' program can be used to create recordings AND the recording index.
 * - typically you want to use this recordedBackend with the recordings from the reference workspace; there
 *   is already tooling and infrastructure around populating that project
 *
 * @param index - recording index
 * @param config - backend config, for now just for compatibility sakes with the analytical backend config
 * @internal
 */
export function recordedBackend(
    index: RecordingIndex,
    config: AnalyticalBackendConfig = defaultConfig,
): IAnalyticalBackend {
    const backend: IAnalyticalBackend = {
        capabilities: {},
        config,
        onHostname(hostname: string): IAnalyticalBackend {
            return recordedBackend(index, { ...config, hostname });
        },
        withTelemetry(_component: string, _props: object): IAnalyticalBackend {
            return backend;
        },
        withAuthentication(_: IAuthenticationProvider): IAnalyticalBackend {
            return this;
        },

        workspace(id: string): IAnalyticalWorkspace {
            const workspaceEntry = `ws_${id}`;
            const workspaceRecordings = index[workspaceEntry];

            if (!workspaceRecordings) {
                throw new UnexpectedResponseError("Workspace recordings not found", 404, {});
            }

            return recordedWorkspace(id, index[workspaceEntry]);
        },
        authenticate(): Promise<AuthenticatedPrincipal> {
            return Promise.resolve({ userId: "recordedUser" });
        },
        isAuthenticated(): Promise<AuthenticatedPrincipal | null> {
            return Promise.resolve({ userId: "recordedUser" });
        },
    };

    return backend;
}

function recordedWorkspace(workspace: string, recordings: WorkspaceRecordings = {}): IAnalyticalWorkspace {
    return {
        workspace,
        execution(): IExecutionFactory {
            return new RecordedExecutionFactory(recordings, workspace);
        },
        elements(): IElementQueryFactory {
            throw new NotSupported("not supported");
        },
        settings(): IWorkspaceSettingsService {
            throw new NotSupported("not supported");
        },
        metadata(): IWorkspaceMetadata {
            throw new NotSupported("not supported");
        },
        styling(): IWorkspaceStylingService {
            throw new NotSupported("not supported");
        },
    };
}