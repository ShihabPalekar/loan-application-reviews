
import { useEffect, useMemo, useState } from "react";
import "./ApplicationsPage.css"
import { useApplications } from "../../hooks/useApplications";
import type { Status, ListParams } from "../../api/mockApi";

type StatusFilter = Status | "ALL";
type SortBy = "createdAt" | "loanAmount";
type SortDir = "asc" | "desc";

const getPageFromUrl = () => {
  const page = Number(new URLSearchParams(window.location.search).get("page"));
  return Number.isInteger(page) && page > 0 ? page : 1;
};

const getSearchFromUrl = () => {
  return new URLSearchParams(window.location.search).get("search") ?? "";
};

const getStatusFromUrl = (): StatusFilter => {
  const status = new URLSearchParams(window.location.search).get("status");

  if (status === "PENDING" || status === "APPROVED" || status === "REJECTED") {
    return status;
  }

  return "ALL";
};

const getSortByFromUrl = (): SortBy => {
  const sortBy = new URLSearchParams(window.location.search).get("sortBy");

  return sortBy === "loanAmount" ? "loanAmount" : "createdAt";
};

const getSortDirFromUrl = (): SortDir => {
  const sortDir = new URLSearchParams(window.location.search).get("sortDir");

  return sortDir === "asc" ? "asc" : "desc";
};

const ApplicationsPage = () => {
  const [page, setPage] = useState(getPageFromUrl);
  const [search, setSearch] = useState(getSearchFromUrl);
  const [searchInput, setSearchInput] = useState(getSearchFromUrl);
  const [status, setStatus] = useState<StatusFilter>(getStatusFromUrl);
  const [sortBy, setSortBy] = useState<SortBy>(getSortByFromUrl);
  const [sortDir, setSortDir] = useState<SortDir>(getSortDirFromUrl);

  useEffect(() => {
    const handlePopState = () => {
      setPage(getPageFromUrl());

      const urlSearch = getSearchFromUrl();
      setSearch(urlSearch);
      setSearchInput(urlSearch);

      setStatus(getStatusFromUrl());
      setSortBy(getSortByFromUrl());
      setSortDir(getSortDirFromUrl());
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const params = useMemo<ListParams>(
    () => ({
      page,
      pageSize: 20,
      search,
      status,
      sortBy,
      sortDir,
    }),
    [page, search, status, sortBy, sortDir]
  );

  const {
    applications,
    total,
    loading,
    error,
    refetch,
    updateApplicationStatus,
    updatingIds,
    actionError,
  } = useApplications(params);

  const totalPages = Math.ceil(total / 20);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const value = searchInput.trim();
    const url = new URL(window.location.href);

    if (value) {
      url.searchParams.set("search", value);
    } else {
      url.searchParams.delete("search");
    }

    url.searchParams.set("page", "1");

    window.history.pushState({}, "", url);

    setSearch(value);
    setPage(1);
  };

  const handleStatusChange = (nextStatus: StatusFilter) => {
    const url = new URL(window.location.href);

    if (nextStatus === "ALL") {
      url.searchParams.delete("status");
    } else {
      url.searchParams.set("status", nextStatus);
    }

    url.searchParams.set("page", "1");

    window.history.pushState({}, "", url);

    setStatus(nextStatus);
    setPage(1);
  };

  const handleSortChange = (nextSortBy: SortBy, nextSortDir: SortDir) => {
    const url = new URL(window.location.href);

    url.searchParams.set("sortBy", nextSortBy);
    url.searchParams.set("sortDir", nextSortDir);
    url.searchParams.set("page", "1");

    window.history.pushState({}, "", url);

    setSortBy(nextSortBy);
    setSortDir(nextSortDir);
    setPage(1);
  };

  const changePage = (nextPage: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set("page", String(nextPage));

    window.history.pushState({}, "", url);
    setPage(nextPage);
  };

  if (loading) return <p>Loading applications...</p>;

  if (error) {
    return (
      <div>
        <p>{error}</p>
        <button onClick={refetch}>Retry</button>
      </div>
    );
  }

  return (
    <main className="applications-page">
      <header className="page-header">
        <div>
          <h1>Loan Applications</h1>
          <p>Review and manage loan applications.</p>
        </div>

        <div className="total-count">
          <span>Total Applications</span>
          <strong>{total.toLocaleString("en-IN")}</strong>
        </div>
      </header>

      <div className="toolbar">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search by applicant name or ID"
            className="search-input"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />

          <button type="submit" className="toolbar-button">Search</button>
        </form>

        <div>
          <label htmlFor="status-filter">Filter by status: </label>

          <select
            id="status-filter"
            value={status}
            onChange={(event) =>
              handleStatusChange(event.target.value as StatusFilter)
            }
            className="toolbar-select"
          >
            <option value="ALL">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div>
          <label htmlFor="sort-by">Sort by: </label>

          <select
            id="sort-by"
            value={sortBy}
            onChange={(event) =>
              handleSortChange(event.target.value as SortBy, sortDir)
            }
            className="toolbar-select"
          >
            <option value="createdAt">Created Date</option>
            <option value="loanAmount">Loan Amount</option>
          </select>

          <label htmlFor="sort-dir">Order: </label>

          <select
            id="sort-dir"
            value={sortDir}
            onChange={(event) =>
              handleSortChange(sortBy, event.target.value as SortDir)
            }
            className="toolbar-select"
          >
            <option value="asc">
              {sortBy === "loanAmount" ? "Low to High" : "Oldest to Newest"}
            </option>
            <option value="desc">
              {sortBy === "loanAmount" ? "High to Low" : "Newest to Oldest"}
            </option>
          </select>
        </div>
      </div>

      {actionError && <p role="alert">{actionError}</p>}

      {applications.length === 0 ? (
        <p>No applications found.</p>
      ) : (
        <div className="table-container">
          <table className="applications-table">
            <thead className="table-header">
              <tr>
                <th>ID</th>
                <th>Applicant</th>
                <th>Email</th>
                <th>Loan Amount</th>
                <th>City</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {applications.map((application) => {
                const isUpdating = updatingIds.has(application.id);

                return (
                  <tr key={application.id} className="table-row">
                    <td>{application.id}</td>
                    <td>{application.applicantName}</td>
                    <td>{application.email ?? "N/A"}</td>
                    <td>
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 0,
                      }).format(application.loanAmount / 100)}
                    </td>
                    <td>{application.city}</td>
                    <td>
                      <span className={`status-badge status-${application.status.toLowerCase()}`}>
                        {application.status}
                      </span>
                    </td>
                    <td>
                      {new Date(application.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td>
                      {application.status === "PENDING" ? (
                        <div className="action-button-wrapper">
                          <button
                            disabled={isUpdating}
                            onClick={() =>
                              updateApplicationStatus(application, "APPROVED")
                            }
                            className="action-button approve-button"
                          >
                            {isUpdating ? "Updating..." : "Approve"}
                          </button>

                          <button
                            disabled={isUpdating}
                            onClick={() =>
                              updateApplicationStatus(application, "REJECTED")
                            }
                            className="action-button reject-button"
                          >
                            {isUpdating ? "Updating..." : "Reject"}
                          </button>
                        </div>
                      ) : (
                        <span className="no-action">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

<div className="pagination">
  <button
    className="pagination-button"
    disabled={page === 1}
    onClick={() => changePage(page - 1)}
  >
    Previous
  </button>

  <span className="pagination-info">
    Page <strong>{page}</strong> of <strong>{totalPages}</strong>
  </span>

  <button
    className="pagination-button"
    disabled={page >= totalPages}
    onClick={() => changePage(page + 1)}
  >
    Next
  </button>
</div>
    </main>
  );
};

export default ApplicationsPage;
