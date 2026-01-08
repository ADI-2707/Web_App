import React, { useEffect, useState, useRef } from "react";
import { PlusSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CreateProjectModal from "../Components/CreateProjectModal";
import SecurityPinModal from "../Components/SecurityPinModal";
import ProjectSection from "../Components/ProjectSection";
import api from "../Utility/api";

/* ---------- Utils ---------- */
const formatUserName = (fullName) => {
  if (!fullName || typeof fullName !== "string") return "";
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) return parts[0];
  return `${parts.at(-1)[0].toUpperCase()}. ${parts[0]}`;
};

/* ---------- Component ---------- */
const HomePrivate = () => {
  const navigate = useNavigate();
  const debounceRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const displayName = formatUserName(user?.full_name);

  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showPinModal, setShowPinModal] = useState(false);
  const [securityPin, setSecurityPin] = useState(null);

  /* ---------- Fetch Projects ---------- */
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/projects/my/");
      setProjects(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  /* ---------- Modal trigger from navbar ---------- */
  useEffect(() => {
    const openModal = () => setShowModal(true);
    window.addEventListener("open-create-project", openModal);
    return () => window.removeEventListener("open-create-project", openModal);
  }, []);

  /* ---------- Create Project ---------- */
  const handleCreate = async (payload) => {
    const res = await api.post("/api/projects/create/", payload);
    setSecurityPin(res.data.pin);
    setShowPinModal(true);
    fetchProjects();
  };

  /* ---------- Search (unchanged) ---------- */
  useEffect(() => {
    if (!searchQuery.trim()) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      if (searchQuery.length < 3) return;
      console.log("Debounced search:", searchQuery);
    }, 450);

    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  const handleSearchClick = () => {
    if (!searchQuery.trim()) return;
    console.log("Manual search:", searchQuery);
  };

  /* ---------- Categorization ---------- */
  const ownedProjects = projects.filter((p) => p.is_owner);
  const joinedProjects = projects.filter((p) => !p.is_owner && (p.role === "admin" || p.role === "user"));
  const invitedProjects = projects.filter((p) => p.role === "invited");

  /* ---------- Open Project ---------- */
  const openProject = (project) => {
    localStorage.setItem("activeProjectId", project.id);
    navigate(`/projects/${project.id}`);
  };

  /* ---------- Render ---------- */
  return (
    <div className="home-private-container">
      <h1 className="home-title">
        Welcome{displayName ? `, ${displayName}` : ""}
      </h1>

      {/* SEARCH — ALWAYS VISIBLE */}
      <div className="project-search-bar">
        <input
          type="text"
          placeholder="Search project by ID or name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button onClick={handleSearchClick}>Search</button>
      </div>

      {!loading && !error && (
        <>
          <ProjectSection
            title="Owned Projects"
            projects={ownedProjects}
            onOpen={openProject}
          />

          <ProjectSection
            title="Joined Projects"
            projects={joinedProjects}
            onOpen={openProject}
          />

          {invitedProjects.length > 0 && (
            <ProjectSection
              title="Invitations"
              projects={invitedProjects}
              onOpen={openProject}
            />
          )}

          {/* CREATE PROJECT CARD */}
          <div
            className="empty-project-card card-surface"
            onClick={() => setShowModal(true)}
          >
            <PlusSquare size={52} className="plus" />
            <p className="empty-project-text">Create new project</p>
          </div>
        </>
      )}

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