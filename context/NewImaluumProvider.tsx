"use client";

import useProfile from "@/hooks/useProfile";
import useResult from "@/hooks/useResult";
import useSchedule from "@/hooks/useSchedule";
import { GetUserProfile } from "@/lib/server/profile-scraper";
import { GetResult } from "@/lib/server/result-scraper";
import { GetSchedule } from "@/lib/server/schedule-scraper";
import { useQuery } from "@tanstack/react-query";
import LottiePlayer from "@/components/LottiePlayer";
import { useEffect } from "react";

const NewImaluumProvider = ({ children }: { children: React.ReactNode }) => {
  const { profile, setProfile } = useProfile();
  const { result, setResult } = useResult();
  const { schedule, setSchedule } = useSchedule();

  const profileData = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const data = await GetUserProfile(profile.matricNo as string);
      if (data.success) {
        setProfile(data.data);
        return data.data;
      }
      console.log("error: ", data.error);
    },
    retry: 3,
  });

  const resultData = useQuery({
    queryKey: ["result"],
    queryFn: async () => {
      const data = await GetResult();
      if (data.success) {
        // @ts-ignore
        setResult(data.data);
        return data.data;
      }
      console.log("error: ", data.error);
    },
    retry: 3,
  });

  const scheduleData = useQuery({
    queryKey: ["schedule"],
    queryFn: async () => {
      const data = await GetSchedule();
      if (data.success) {
        setSchedule(data.data);
        return data.data;
      }
      console.log("error: ", data.error);
    },
    retry: 3,
  });

  useEffect(() => {
    if (schedule) {
      console.log("schedule: ", schedule);
    } else {
      console.log("no schedule");
    }

    if (result) {
      console.log("result: ", result);
    } else {
      console.log("no result");
    }

    if (profile) {
      console.log("profile: ", profile);
    } else {
      console.log("no profile");
    }
  }, [schedule, result, profile]);

  return profileData.isSuccess &&
    resultData.isSuccess &&
    scheduleData.isSuccess ? (
    <>{children}</>
  ) : (
    <div className="w-full h-screen bg-zinc-950 flex items-center justify-center">
      <LottiePlayer
        animationData={require("../public/lottie/loading.lottie")}
      />
    </div>
  );
};

export default NewImaluumProvider;