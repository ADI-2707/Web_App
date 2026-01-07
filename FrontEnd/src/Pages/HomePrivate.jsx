import React, { useEffect, useState } from "react";
import { PlusSquare, Folder } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CreateProjectModal from "../Components/CreateProjectModal";
import SecurityPinModal from "../Components/SecurityPinModal";
import api from "../Utility/api"; // axios instance with auth headers

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

  const user = JSON.parse(localStorage.getItem("user"));
  const displayName = formatUserName(user?.full_name);

  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showPinModal, setShowPinModal] = useState(false);
  const [securityPin, setSecurityPin] = useState(null);

  /* ---------- Fetch My Projects ---------- */
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

  /* ---------- On Mount ---------- */
  useEffect(() => {
    fetchProjects();
  }, []);

  /* ---------- Listen from Navbar ---------- */
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
      // refresh list
      fetchProjects();

      // ✅ RETURN BACKEND RESPONSE (contains PIN)
      return res.data;
    } catch (err) {
      console.error(err);
      throw err; // let modal handle error
    }
  };

  /* ---------- Open Project ---------- */
  const openProject = (project) => {
    localStorage.setItem("activeProjectId", project.id);
    navigate(`/dashboard/${project.id}`);
  };

  /* ---------- Render ---------- */
  return (
    <div className="home-private-container">
      {/* Header */}
      <h1 className="home-title mt-5">
        Welcome{displayName ? `, ${displayName}` : ""}
      </h1>

      {/* Loading */}
      {loading && <p className="opacity-60 mt-10">Loading projects…</p>}

      {/* Error */}
      {!loading && error && <p className="text-red-500 mt-10">{error}</p>}

      {/* Empty State */}
      {!loading && projects.length === 0 && !error && (
        <div
          className="empty-project-wrapper mt-10"
          onClick={() => setShowModal(true)}
        >
          <div className="empty-project-card">
            <PlusSquare size={64} strokeWidth={1.5} />
            <p className="empty-project-text">Create your first project</p>
          </div>
        </div>
      )}

      {/* Project Grid */}
      {!loading && projects.length > 0 && (
        <div className="project-grid">
          {projects.map((project) => (
            <div
              key={project.id}
              className="project-card"
              onClick={() => openProject(project)}
            >
              <div className="project-card-icon">
                <Folder size={36} />
              </div>

              <div className="project-card-title">{project.name}</div>

              <div className="project-card-meta">
                Role: {project.role.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <CreateProjectModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}

      {/* 🔐 SECURITY PIN MODAL */}
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
