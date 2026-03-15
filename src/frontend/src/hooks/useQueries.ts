import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckInResult } from "../backend.d";
import { useActor } from "./useActor";

export function useGetAllMembers() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMembers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTodaysAttendance() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["todaysAttendance"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTodaysAttendance();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllAttendance() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allAttendance"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAttendance();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCheckInByQR() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (qrToken: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.checkInByQR(qrToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todaysAttendance"] });
      queryClient.invalidateQueries({ queryKey: ["allAttendance"] });
    },
  });
}

export function useCheckInByFace() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.checkInByFace(memberId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todaysAttendance"] });
      queryClient.invalidateQueries({ queryKey: ["allAttendance"] });
    },
  });
}

export function useCreateMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, email }: { name: string; email: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createMember(name, email);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

export { CheckInResult };
