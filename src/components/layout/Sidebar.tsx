// "use client";

// import { useEffect, useState } from "react";
// import {
//   Home,
//   User,
//   Settings,
//   Menu,
//   Folder,
//   PanelLeftClose,
//   Upload,
//   User2Icon,
//   UserCircle,
//   UserIcon,
// } from "lucide-react";
// import { useRouter, usePathname } from "next/navigation";
// import clsx from "clsx";
// import { useMediaQuery } from "@/lib/use-media-query";

// import { Button } from "@/components/ui/button";
// import {
//   Tooltip,
//   TooltipProvider,
//   TooltipTrigger,
//   TooltipContent,
// } from "@/components/ui/tooltip";
// import {
//   DropdownMenu,
//   DropdownMenuTrigger,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
// } from "@/components/ui/dropdown-menu";
// import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
// import {
//   Sheet,
//   SheetContent,
//   SheetHeader,
//   SheetTrigger,
// } from "@/components/ui/sheet";

// import { useAuth } from "@/context/AuthContext";
// import ProfileDrawer from "../ProfileDrawer";
// import { Skeleton } from "../ui/skeleton";
// import UploadProjectDialog from "../UploadProjectDialog";

// const navItems = [
//   { name: "Dashboard", icon: Home, path: "/dashboard" },
//   { name: "Projects", icon: Folder, path: "/projects" },
//   { name: "Profile", icon: User, path: "/profile" },
//   { name: "Settings", icon: Settings, path: "/settings" },
// ];

// export default function Sidebar() {
//   const { user } = useAuth();
//   const [collapsed, setCollapsed] = useState(false);
//   const [sheetOpen, setSheetOpen] = useState(false);
//   const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
//   const pathname = usePathname();
//   const router = useRouter();

//   const isMobile = useMediaQuery("(max-width: 768px)");

//   const NavItems = () => (
//     <nav className="flex flex-col gap-1 p-2">
//       {navItems.map(({ name, icon: Icon, path }) => {
//         const isActive = pathname?.startsWith(path);
//         const isProjects = name === "Projects";

//         return (
//           <div key={name} className="relative">
//             {collapsed ? (
//               <Tooltip delayDuration={100}>
//                 <TooltipTrigger asChild>
//                   <Button
//                     variant="ghost"
//                     onClick={() => {
//                       router.push(path);
//                       setSheetOpen(false);
//                     }}
//                     className={clsx(
//                       "flex items-center justify-center w-full px-3 py-2 rounded-lg text-sm transition-all",
//                       isActive
//                         ? "bg-accent text-accent-foreground font-semibold"
//                         : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
//                     )}
//                   >
//                     <Icon size={20} />
//                   </Button>
//                 </TooltipTrigger>
//                 <TooltipContent side="right">
//                   <span>{name}</span>
//                 </TooltipContent>
//               </Tooltip>
//             ) : (
//               <div className="flex items-center gap-2 w-full">
//                 <Button
//                   variant="ghost"
//                   onClick={() => {
//                     router.push(path);
//                     setSheetOpen(false);
//                   }}
//                   className={clsx(
//                     "flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all justify-start",
//                     isActive
//                       ? "bg-accent text-accent-foreground font-semibold"
//                       : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
//                   )}
//                 >
//                   <Icon size={20} />
//                   <span>{name}</span>
//                 </Button>

//                 {isProjects && (
//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     onClick={() => setUploadDialogOpen(true)}
//                     className="hover:text-primary text-muted-foreground"
//                   >
//                     <Upload size={18} />
//                   </Button>
//                 )}
//               </div>
//             )}
//           </div>
//         );
//       })}
//     </nav>
//   );

//   const SidebarContent = (
//     <>
//       <div className="relative h-14 flex items-center border-b border-border px-4">
//         <span
//           className={clsx(
//             "text-xl font-bold text-primary transition-opacity duration-200 whitespace-nowrap",
//             collapsed && "opacity-0"
//           )}
//         >
//           Legacy Code
//         </span>
//         {!isMobile && (
//           <div
//             className={clsx(
//               "absolute top-1/2 -translate-y-1/2 transition-all duration-500",
//               collapsed ? "left-2" : "right-2"
//             )}
//           >
//             <Button
//               variant="ghost"
//               size="icon"
//               onClick={() => setCollapsed(!collapsed)}
//               className="rounded-full"
//             >
//               {collapsed ? <Menu size={20} /> : <PanelLeftClose size={20} />}
//             </Button>
//           </div>
//         )}
//       </div>

//       <NavItems />
//       <SidebarUser user={user} collapsed={collapsed} />
//     </>
//   );

//   if (isMobile) {
//     return (
//       <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
//         <SheetTrigger asChild>
//           <Button variant="ghost" size="icon" className="m-2">
//             <Menu />
//           </Button>
//         </SheetTrigger>
//         <SheetContent side="left" className="w-64 px-0 py-0">
//           <SheetHeader className="px-4 py-3 border-b border-border font-bold text-primary text-lg">
//             Legacy Code
//           </SheetHeader>
//           {SidebarContent}
//         </SheetContent>
//       </Sheet>
//     );
//   }

//   return (
//     <TooltipProvider>
//       <aside
//         className={clsx(
//           "h-screen flex flex-col fixed top-0 left-0 bg-muted border-r-2 border-border transition-all duration-300 ease-in-out z-50",
//           collapsed ? "w-16" : "w-64"
//         )}
//       >
//         {SidebarContent}
//         <UploadProjectDialog
//           open={uploadDialogOpen}
//           onOpenChange={setUploadDialogOpen}
//         />
//       </aside>
//     </TooltipProvider>
//   );
// }

// function SidebarUser({ user, collapsed }: { user: any; collapsed: boolean }) {
//   const [showProfilePanel, setShowProfilePanel] = useState(false);
//   const [isProfile, setIsProfile] = useState(true);

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setIsProfile(false);
//     }, 10000);

//     return () => clearTimeout(timer);
//   }, []);

//   return (
//     <div className="mt-auto w-full border-t border-border p-3">
//       <DropdownMenu>
//         <DropdownMenuTrigger className="w-full focus:outline-none">
//           <div className="flex items-center gap-3 hover:bg-muted/60 rounded-xl p-2 transition-all">
//             <Avatar className="h-9 w-9 border shadow-sm">
//               <AvatarImage src={user?.photoURL ?? undefined} />
//               <AvatarFallback className="bg-gray-200">
//                 {isProfile ? (
//                   <Skeleton className="h-20 w-20 rounded-full bg-slate-300" />
//                 ) : (
//                   <UserIcon size={20} />
//                 )}
//               </AvatarFallback>
//             </Avatar>
//             {!collapsed && (
//               <div className="flex flex-col text-left overflow-hidden">
//                 <span className="text-sm font-semibold truncate">
//                   {user?.name ?? "User"}
//                 </span>
//                 <span className="text-xs text-muted-foreground truncate">
//                   {user?.email ?? ""}
//                 </span>
//               </div>
//             )}
//           </div>
//         </DropdownMenuTrigger>
//         <DropdownMenuContent
//           side="top"
//           align="start"
//           className="w-48 bg-white"
//           aria-describedby={undefined}
//         >
//           <DropdownMenuLabel className="text-muted-foreground">
//             My Account
//           </DropdownMenuLabel>
//           <DropdownMenuSeparator />
//           <DropdownMenuItem onClick={() => setShowProfilePanel(true)}>
//             <User className="mr-2 h-4 w-4" />
//             <span>Profile</span>
//           </DropdownMenuItem>
//         </DropdownMenuContent>
//       </DropdownMenu>

//       {showProfilePanel && (
//         <ProfileDrawer user={user} onClose={() => setShowProfilePanel(false)} />
//       )}
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import {
  Home,
  User,
  Settings,
  Menu,
  Folder,
  PanelLeftClose,
  LogOut,
  User2Icon,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import clsx from "clsx";
import { useMediaQuery } from "@/lib/use-media-query";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";

import { useAuth } from "@/context/AuthContext";
import ProfileDrawer from "../ProfileDrawer";
import { Skeleton } from "../ui/skeleton";

const navItems = [
  { name: "Dashboard", icon: Home, path: "/dashboard" },
  { name: "Projects", icon: Folder, path: "/projects" },
  { name: "Profile", icon: User, path: "/profile" },
  { name: "Settings", icon: Settings, path: "/settings" },
];

export default function Sidebar() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isMobile = useMediaQuery("(max-width: 768px)");

  const NavItems = () => (
    <nav className="flex flex-col gap-1 p-2">
      {navItems.map(({ name, icon: Icon, path }) => {
        const isActive = pathname?.startsWith(path);
        const button = (
          <Button
            variant="ghost"
            onClick={() => {
              router.push(path);
              setSheetOpen(false);
            }}
            className={clsx(
              "flex items-center justify-start gap-3 w-full px-3 py-2 rounded-lg text-sm transition-all",
              collapsed ? "justify-center" : "justify-start",
              isActive
                ? "bg-accent text-accent-foreground font-semibold"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon size={20} />
            {!collapsed && <span>{name}</span>}
          </Button>
        );

        return (
          <div key={name}>
            {collapsed ? (
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent side="right">
                  <span>{name}</span>
                </TooltipContent>
              </Tooltip>
            ) : (
              button
            )}
          </div>
        );
      })}
    </nav>
  );

  const SidebarContent = (
    <>
      <div className="relative h-14 flex items-center border-b border-border px-4">
        <span
          className={clsx(
            "text-xl font-bold text-primary transition-opacity duration-200 whitespace-nowrap",
            collapsed && "opacity-0"
          )}
        >
          Legacy Code
        </span>
        {!isMobile && (
          <div
            className={clsx(
              "absolute top-1/2 -translate-y-1/2 transition-all duration-500",
              collapsed ? "left-2" : "right-2"
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="rounded-full"
            >
              {collapsed ? <Menu size={20} /> : <PanelLeftClose size={20} />}
            </Button>
          </div>
        )}
      </div>

      <NavItems />
      <SidebarUser user={user} collapsed={collapsed} />
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="m-2">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 px-0 py-0">
          <SheetHeader className="px-4 py-3 border-b border-border font-bold text-primary text-lg">
            Legacy Code
          </SheetHeader>
          {SidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <TooltipProvider>
      <aside
        className={clsx(
          "h-screen flex flex-col fixed top-0 left-0 bg-muted border-r-2 border-border transition-all duration-300 ease-in-out z-50",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {SidebarContent}
      </aside>
    </TooltipProvider>
  );
}

function SidebarUser({ user, collapsed }: { user: any; collapsed: boolean }) {
  const [showProfilePanel, setShowProfilePanel] = useState<boolean>(false);
  const [hasUserProfile, setHasUserProfile] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasUserProfile(false);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="mt-auto w-full border-t border-border p-3">
      <DropdownMenu>
        <DropdownMenuTrigger className="w-full focus:outline-none">
          <div className="flex items-center gap-3 hover:bg-muted/60 rounded-xl p-2 transition-all">
            <Avatar className="h-9 w-9 border shadow-sm">
              <AvatarImage src={user?.photoURL ?? undefined} />
              <AvatarFallback>
                {hasUserProfile ? (
                  <Skeleton className="h-16 w-16 rounded-full bg-gray-300" />
                ) : (
                  <User2Icon size={20} />
                )}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex flex-col text-left overflow-hidden">
                <span className="text-sm font-semibold truncate">
                  {user?.name ?? "User"}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {user?.email ?? ""}
                </span>
              </div>
            )}
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-48 bg-white">
          <DropdownMenuLabel className="text-muted-foreground">
            My Account
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowProfilePanel(true)}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showProfilePanel && (
        <ProfileDrawer user={user} onClose={() => setShowProfilePanel(false)} />
      )}
    </div>
  );
}
