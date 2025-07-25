"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud, FolderOpen } from "lucide-react";
import { getAuth } from "firebase/auth";
import ProjectCard from "@/components/ProjectCard";
import UploadProjectModal from "@/components/UploadProjectModel";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

type Project = {
  _id: string;
  projectName: string;
  createdAt: string;
};

export default function ProjectsPage() {
  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const token = await getAuth().currentUser?.getIdToken();
      const res = await fetch("/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setProjects(data.projects || []);
      } else {
        toast.error("Failed to load projects");
      }
    } catch (err) {
      console.error("FETCH_PROJECTS_ERROR:", err);
      toast.error("Something went wrong while fetching projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <motion.div
      className="p-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-primary">
          Your Projects
        </h1>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => setOpenUploadModal(true)}
            className="flex items-center gap-2 shadow-sm"
          >
            <UploadCloud size={18} />
            Upload Project
          </Button>
        </motion.div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-32 w-full rounded-xl bg-muted/40 animate-pulse"
            />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-24 text-center text-muted-foreground">
          <FolderOpen className="h-12 w-12 mb-4 opacity-80" />
          <p className="text-lg font-medium">No projects yet</p>
          <p className="text-sm mt-1">
            Upload your first project to get started!
          </p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.05,
              },
            },
          }}
        >
          <AnimatePresence>
            {projects.map((project) => (
              <motion.div
                key={project._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                whileHover={{
                  scale: 1.015,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                }}
              >
                <ProjectCard {...project} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <UploadProjectModal
        open={openUploadModal}
        onClose={() => {
          setOpenUploadModal(false);
          fetchProjects();
        }}
      />
    </motion.div>
  );
}
