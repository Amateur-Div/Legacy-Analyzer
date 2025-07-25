"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Folder, CalendarClock } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type ProjectCardProps = {
  _id: string;
  projectName: string;
  createdAt: string;
};

export default function ProjectCard({
  _id,
  projectName,
  createdAt,
}: ProjectCardProps) {
  const router = useRouter();

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="transition-transform"
    >
      <Card
        onClick={() => router.push(`/projects/${_id}`)}
        className="cursor-pointer border border-border hover:border-primary/50 hover:shadow-md transition-all duration-200"
      >
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Folder size={20} className="text-primary" />
            <h2 className="font-semibold text-base truncate max-w-[85%]">
              {projectName}
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarClock size={14} />
            <span suppressHydrationWarning>
              {new Date(createdAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
