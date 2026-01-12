import React, { useEffect, useState, useRef } from "react";
import { PlusSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CreateProjectModal from "../Components/CreateProjectModal";
import SecurityPinModal from "../Components/SecurityPinModal";
import ProjectSection from "../Components/ProjectSection";
import api from "../Utility/api";
import { isAuthenticated } from "../Utility/auth";

const LIMIT = 10;

/* ---------- Utils ---------- */
const formatUserName = (fullName) => {
  if (!fullName || typeof fullName !== "string") return "";
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) return parts[0];
  return `${parts.at(-1)[0].toUpperCase()}. ${parts[0]}`;
};

const HomePrivate = () => {
  const navigate = useNavigate();
  const debounceRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const displayName = formatUserName(user?.full_name);

  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [showPinModal, setShowPinModal] = useState(false);
  const [securityPin, setSecurityPin] = useState(null);

  const [owned, setOwned] = useState([]);
  const [joined, setJoined] = useState([]);

  const [ownedCursor, setOwnedCursor] = useState(null);
  const [joinedCursor, setJoinedCursor] = useState(null);

  const [ownedHasMore, setOwnedHasMore] = useState(true);
  const [joinedHasMore, setJoinedHasMore] = useState(true);

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const loadingOwnedRef = useRef(false);
  const loadingJoinedRef = useRef(false);

  /* ---------- Initial Load (AUTH-SAFE) ---------- */
  useEffect(() => {
    if (!isAuthenticated()) return;

    loadOwned();
    loadJoined();
  }, []);

  /* ---------- LOAD OWNED PROJECTS ---------- */
  const loadOwned = async () => {
    // 1. Strict guard: if already loading, exit.
    if (!ownedHasMore || loadingOwnedRef.current) return;
    loadingOwnedRef.current = true;

    try {
      const res = await api.get("/api/projects/owned/", {
        params: { cursor: ownedCursor, limit: LIMIT },
      });

      setOwned((prev) => {
        // If cursor is null, we are on page 1. REPLACE the list.
        if (!ownedCursor) return res.data.results;

        // If appending, deduplicate by ID to ensure no repeats.
        const map = new Map(prev.map((p) => [p.id, p]));
        res.data.results.forEach((p) => map.set(p.id, p));
        return Array.from(map.values());
      });

      setOwnedCursor(res.data.next_cursor);
      setOwnedHasMore(res.data.has_more);
    } catch (err) {
      console.error("Load failed", err);
    } finally {
      // 2. Only unlock after the state is fully committed.
      loadingOwnedRef.current = false;
    }
  };

  /* ---------- LOAD JOINED PROJECTS ---------- */
  const loadJoined = async () => {
    if (!joinedHasMore || loadingJoinedRef.current) return;
    loadingJoinedRef.current = true;

    try {
      const res = await api.get("/api/projects/joined/", {
        params: { cursor: joinedCursor, limit: LIMIT },
      });

      setJoined((prev) => {
        const map = new Map(prev.map((p) => [p.id, p]));
        res.data.results.forEach((p) => map.set(p.id, p));
        return Array.from(map.values());
      });

      setJoinedCursor(res.data.next_cursor);
      setJoinedHasMore(res.data.has_more);
    } finally {
      loadingJoinedRef.current = false;
    }
  };

  /* ---------- Modal trigger from navbar ---------- */
  useEffect(() => {
    const openModal = () => setShowModal(true);
    window.addEventListener("open-create-project", openModal);
    return () => window.removeEventListener("open-create-project", openModal);
  }, []);

  /* ---------- Create Project ---------- */
  const handleCreate = async (payload) => {
    try {
      const res = await api.post("/api/projects/create/", payload);
      setSecurityPin(res.data.pin);
      setShowPinModal(true);

      // LOCK: Prevent any background observer triggers.
      loadingOwnedRef.current = true;

      // RESET: Clear state for a fresh start.
      setOwned([]);
      setOwnedCursor(null);
      setOwnedHasMore(true);

      // FETCH: Get the fresh page 1 immediately.
      const refreshRes = await api.get("/api/projects/owned/", {
        params: { cursor: null, limit: LIMIT },
      });

      setOwned(refreshRes.data.results);
      setOwnedCursor(refreshRes.data.next_cursor);
      setOwnedHasMore(refreshRes.data.has_more);
    } catch (err) {
      console.error("Creation failed", err);
    } finally {
      // UNLOCK: Allow infinite scroll for page 2 now.
      loadingOwnedRef.current = false;
    }
  };

  /* ---------- Search (UI-only for now) ---------- */
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      if (searchQuery.length < 2) return;

      try {
        setIsSearching(true);
        const res = await api.get("/api/projects/search/", {
          params: { q: searchQuery },
        });
        setSearchResults(res.data.results);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 450);

    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  const handleSearchClick = async () => {
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      const res = await api.get("/api/projects/search/", {
        params: { q: searchQuery },
      });
      setSearchResults(res.data.results);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setIsSearching(false);
    }
  };

  /* ---------- Open Project ---------- */
  const openProject = (project) => {
    localStorage.setItem("activeProjectId", project.id);
    navigate(`/projects/${project.id}`);
  };

  return (
    <div className="home-private-container">
      <h1 className="home-title">
        Welcome{displayName ? `, ${displayName}` : ""}
      </h1>

      {/* SEARCH */}
      <div className="project-search-bar">
        <input
          type="text"
          placeholder="Search project by ID or name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button onClick={handleSearchClick}>Search</button>
      </div>

      {searchResults.length > 0 && (
        <ProjectSection
          title="Search Results"
          projects={searchResults}
          hasMore={false}
          onOpenProject={openProject}
        />
      )}

      <>
        <ProjectSection
          title="Owned Projects"
          projects={owned}
          loadMore={loadOwned}
          hasMore={ownedHasMore}
          onOpenProject={openProject}
        />

        <ProjectSection
          title="Joined Projects"
          projects={joined}
          loadMore={loadJoined}
          hasMore={joinedHasMore}
          onOpenProject={openProject}
        />

        {/* CREATE PROJECT CARD */}
        <div
          className="empty-project-card mt-10"
          onClick={() => setShowModal(true)}
        >
          <PlusSquare size={52} className="plus" />
          <p className="empty-project-text">Create new project</p>
        </div>
      </>

      {showModal && (
        <CreateProjectModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}

      {showPinModal && securityPin && (
        <SecurityPinModal
          pin={securityPin}
          onConfirm={() => {
            setShowPinModal(false);
            setSecurityPin(null);
          }}
        />
      )}
    </div>
  );
};

export default HomePrivate;
