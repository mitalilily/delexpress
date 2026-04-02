import { useMutation, useQuery } from "@tanstack/react-query";
import type { KycDetails } from "../../../types/user.types";
import { getKyc, submitKyc } from "../../../api/kyc";

export const useSubmitKyc = () =>
  useMutation({
    mutationFn: ({ details }: { details: Partial<KycDetails> }) =>
      submitKyc(details),
  });

export const useUserKyc = (enabled = true) =>
  useQuery({
    queryKey: ["userKyc"],
    queryFn: () => getKyc(),
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: false,
  });
