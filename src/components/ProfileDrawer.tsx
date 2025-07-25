"use client";

import { useState, useEffect, useRef, ChangeEvent, useMemo } from "react";
import {
  X,
  Pencil,
  LogOut,
  Moon,
  Sun,
  Laptop2,
  Trash2,
  Check,
  UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { updateUserData } from "@/utils/updateUser";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";
import {
  sendEmailVerification,
  updateProfile,
  deleteUser,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { deleteDoc, doc } from "firebase/firestore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";
import imageCompression from "browser-image-compression";
import CropModal from "./CropModal";

interface UserProps {
  uid: string;
  name?: string;
  email: string;
  bio?: string;
  photoURL?: string;
}

interface ProfileDrawerProps {
  user: UserProps;
  onClose: () => void;
}

export default function ProfileDrawer({ user, onClose }: ProfileDrawerProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [photoURL, setPhotoURL] = useState(user.photoURL || "");
  const [isProfile, setIsProfile] = useState(true);
  const [name, setName] = useState(user.name || "");
  const [originalName, setOriginalName] = useState(user.name || "");
  const [changeName, setChangeName] = useState(false);

  const [bio, setBio] = useState(user.bio || "");
  const [originalBio, setOriginalBio] = useState(user.bio || "");

  const [cropImage, setCropImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [animateIn, setAnimateIn] = useState(false);
  const [closing, setClosing] = useState(false);

  const creationDate = useMemo(() => {
    if (!auth.currentUser?.metadata?.creationTime) return null;
    return new Date(
      auth.currentUser.metadata.creationTime
    ).toLocaleDateString();
  }, [auth.currentUser]);

  const hasChanges = name !== originalName;

  const handleEditClick = () => fileInputRef.current?.click();

  const handleCropComplete = async (blob: Blob) => {
    const file = new File([blob], "cropped-image.jpg", { type: "image/jpg" });
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 800,
    });

    try {
      setUploading(true);
      const data = new FormData();
      data.append("file", compressed);
      data.append("upload_preset", "unsigned_upload");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/da4q1gqhy/image/upload",
        {
          method: "POST",
          body: data,
        }
      );

      const imgURL = (await res.json()).secure_url;
      setPhotoURL(imgURL);

      await updateUserData(user.uid, { photoURL: imgURL });
      await updateProfile(auth.currentUser!, { photoURL: imgURL });

      toast.success("Profile photo was updated!");
    } catch (err) {
      console.error("Upload failed", err);
      toast.error("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const onSelectFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setCropImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    try {
      await updateUserData(user.uid, { name });
      await updateProfile(auth.currentUser!, { displayName: name });
      await auth.currentUser?.reload();
      setOriginalName(name);
      setSuccess(true);
      toast.success("Profile updated!");
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error("Save failed", err);
      toast.error("Failed to update profile.");
    }
  };

  const handleLogout = async () => {
    toast.loading("Logging out...");
    await auth.signOut();
    router.replace("/login");
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(auth.currentUser!);
      toast.success("Account deleted.");
      router.replace("/signup");
    } catch (err: any) {
      if (err.code === "auth/requires-recent-login") {
        toast.info("Please log in again to delete your account.");
        await handleLogout();
      } else {
        toast.error("Failed to delete account.");
        console.error("Delete error:", err);
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 10);

    const setFallBackProfile = setTimeout(() => {
      setIsProfile(false);
    }, 10000);

    return () => {
      clearTimeout(timer), clearTimeout(setFallBackProfile);
    };
  }, []);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => onClose(), 300);
  };

  return (
    <div
      className={cn(
        "fixed top-0 left-0 h-full w-[90vw] md:w-80 max-w-sm text-foreground bg-white dark:bg-zinc-900 text-black dark:text-white border-r border-border shadow-xl z-[9999] p-6 flex flex-col transition-transform duration-300 ease-in-out overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-thumb-rounded-md",
        animateIn && !closing ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {" "}
      <div className="flex justify-between items-center mb-4 sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur z-10">
        {" "}
        <h2 className="text-xl font-semibold">Profile</h2>{" "}
        <Button variant="ghost" size="icon" onClick={handleClose}>
          {" "}
          <X size={18} />{" "}
        </Button>{" "}
      </div>
      <div className="flex items-center gap-4 mb-6">
        <div className="relative group">
          <Avatar className="h-16 w-16">
            <AvatarImage
              src={photoURL}
              alt="avatar"
              className="rounded-full"
              loading="lazy"
            />
            <AvatarFallback className="bg-gray-200">
              {isProfile ? (
                <Skeleton className="h-16 w-16 rounded-full bg-gray-300" />
              ) : (
                <UserIcon size={27} />
              )}
            </AvatarFallback>
          </Avatar>
          <Button
            onClick={handleEditClick}
            disabled={uploading}
            className="absolute bottom-0 right-0 h-auto w-auto bg-white dark:bg-zinc-800 rounded-full p-1 border hover:bg-muted cursor-pointer"
          >
            <Pencil size={14} />
          </Button>
          <input
            title="file"
            type="file"
            ref={fileInputRef}
            onChange={onSelectFile}
            accept="image/*"
            className="hidden"
          />
        </div>

        <div>
          <p className="text-lg font-medium">{name}</p>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {auth.currentUser?.emailVerified ? (
              <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/10 text-green-600 border border-green-600">
                Verified
              </span>
            ) : (
              <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/10 text-red-600 border border-red-600">
                Unverified
              </span>
            )}
          </div>
          {!auth.currentUser?.emailVerified && (
            <Button
              variant="ghost"
              className="px-0 h-6 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-800 hover:underline"
              onClick={async () => {
                if (auth.currentUser) {
                  await sendEmailVerification(auth.currentUser);
                  toast.success("Verification email sent!");
                }
              }}
            >
              Resend verification email
            </Button>
          )}
          {creationDate && (
            <p className="text-xs text-muted-foreground font-light mt-1">
              Member since: {creationDate}
            </p>
          )}
        </div>
      </div>
      {cropImage && (
        <CropModal
          imageSrc={cropImage}
          onClose={() => setCropImage(null)}
          onCropComplete={handleCropComplete}
        />
      )}
      <div className="space-y-4">
        <Label className="text-sm">Name</Label>
        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSave}
            disabled={!changeName}
          />
          <Button variant="outline" onClick={() => setChangeName(!changeName)}>
            {changeName ? "Save" : <Pencil size={12} />}
          </Button>
        </div>
        {success && (
          <div className="flex items-center gap-2 mt-1 text-green-600">
            <Check size={18} />
            <span className="text-sm font-medium">Changes saved</span>
          </div>
        )}

        <div>
          <Label className="text-sm block mb-1">Bio / About</Label>
          <textarea
            className="w-full p-2 rounded-md border text-sm resize-none h-20"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Describe yourself..."
          />
          {bio !== originalBio && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 text-xs"
              onClick={async () => {
                await updateUserData(user.uid, { bio });
                setOriginalBio(bio);
                toast.success("Bio updated!");
              }}
            >
              Save Bio
            </Button>
          )}
        </div>

        <div>
          <Label className="text-sm mb-2 block">Theme</Label>
          <div className="flex gap-2">
            {["light", "dark", "system"].map((t) => (
              <Button
                className={`border-b border-gray-500 ${
                  theme == t ? "rounded-sm" : "rounded-full"
                }`}
                key={t}
                onClick={() => setTheme(t)}
                variant={theme === t ? "default" : "outline"}
                size="icon"
              >
                {t === "light" ? (
                  <Sun size={18} />
                ) : t === "dark" ? (
                  <Moon size={18} />
                ) : (
                  <Laptop2 size={18} />
                )}
              </Button>
            ))}
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => router.push("/reset-password")}
        >
          Change Password
        </Button>
      </div>
      <div className="mt-auto pt-6 space-y-2 space-x-4">
        <Button variant="outline" className="w-24" onClick={handleLogout}>
          <LogOut size={14} className="mr-2" />
          Logout
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-36 hover:bg-red-600 hover:text-white"
            >
              <Trash2 size={14} className="mr-2" />
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Account</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure? This action is permanent and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={handleDeleteAccount}
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
