
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchApplications, updateStatus as updateApplicationStatusApi, subscribe } from "../api/mockApi";
import type { Application, ListParams, Status } from "../api/mockApi";

const PAGE_SIZE = 20;

export const useApplications = (params: ListParams) => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
    const [actionError, setActionError] = useState<string | null>(null);

    const requestId = useRef(0);
    const updatingIdsRef = useRef(new Set<string>());

    const fetchData = useCallback(async () => {
        const currentRequestId = ++requestId.current;

        setLoading(true);
        setError(null);

        try {
            const response = await fetchApplications({
                ...params,
                pageSize: PAGE_SIZE,
            });

            if (currentRequestId !== requestId.current) return;

            setApplications(response.items);
            setTotal(response.total);
        } catch {
            if (currentRequestId !== requestId.current) return;

            setError("Unable to load applications. Please try again.");
        } finally {
            if (currentRequestId === requestId.current) {
                setLoading(false);
            }
        }
    }, [params]);

    useEffect(() => {
        fetchData();

        return () => {
            requestId.current++;
        };
    }, [fetchData]);

    const updateApplicationStatus = async (
        application: Application,
        nextStatus: Status
    ) => {
        if (updatingIdsRef.current.has(application.id)) return;

        updatingIdsRef.current.add(application.id);

        const originalApplication = application;

        // 1. Optimistically update the UI.
        setApplications((currentApplications) =>
            currentApplications.map((item) =>
                item.id === application.id
                    ? { ...item, status: nextStatus }
                    : item
            )
        );

        setUpdatingIds((current) => new Set(current).add(application.id));
        setActionError(null);

        try {
            // 2. Send the actual API request.
            const updatedApplication = await updateApplicationStatusApi(
                application.id,
                nextStatus,
                application.version
            );

            // 3. Keep the server response, including its updated version.
            setApplications((currentApplications) =>
                currentApplications.map((item) =>
                    item.id === application.id ? updatedApplication : item
                )
            );
        } catch (error) {
            // 4. Roll back if the API request fails.
            setApplications((currentApplications) =>
                currentApplications.map((item) =>
                    item.id === application.id ? originalApplication : item
                )
            );

            if (error instanceof Error && error.message.includes("CONFLICT")) {
                setActionError(
                    "This application was updated elsewhere. Please refresh and try again."
                );
            } else {
                setActionError(
                    "Unable to update application status. The original status has been restored."
                );
            }
        } finally {
            updatingIdsRef.current.delete(application.id);

            setUpdatingIds((current) => {
                const updated = new Set(current);
                updated.delete(application.id);
                return updated;
            });
        }
    };

    useEffect(() => {
        const unsubscribe = subscribe(() => {
            fetchData();
        });

        return unsubscribe;
    }, [fetchData]);

    return {
        applications,
        total,
        loading,
        error,
        refetch: fetchData,
        updateApplicationStatus,
        updatingIds,
        actionError,
    };
};
