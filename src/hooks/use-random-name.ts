import { api } from "@/trpc/react";
import { useCallback } from "react";

export const useRandomNameGenerator = () => {
  const utils = api.useUtils();
  const { data: randomName, isFetching } =
    api.containers.getRandomName.useQuery();

  const regenerate = useCallback(() => {
    void utils.containers.getRandomName.invalidate();
  }, [utils]);

  return { randomName, regenerate, isLoading: isFetching };
};
