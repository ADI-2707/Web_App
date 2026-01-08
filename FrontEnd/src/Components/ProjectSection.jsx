import { Folder } from "lucide-react";

const ProjectSection = ({ title, projects, onOpen }) => {
  if (!projects.length) return null;

  return (
    <section className="project-section">
      <h2 className="project-section-title">{title}</h2>

      <div className="project-row">
        {projects.map((project) => (
          <div
            key={project.id}
            className="project-card card-surface"
            onClick={() => onOpen(project)}
          >
            <div className="project-card-icon">
              <Folder size={32} />
            </div>

            <div className="project-card-title">{project.name}</div>
            <div className="project-card-meta">
              Role: {project.role.toUpperCase()}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProjectSection;