import { useQuery } from "@tanstack/react-query";
import { getUserInfo } from "../api/user";

export const useUserInfo = (enabled = true) =>
  useQuery({
    queryKey: ["userInfo"],
    queryFn: () => getUserInfo(),
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: false,
  });
