import { api } from "@/trpc/react";
import { useCallback } from "react";

export const useRandomNameGenerator = (): { randomName: string | undefined, regenerate: () => void } => {

  const utils = api.useUtils();
  const { data: randomName } = api.containers.getRandomName.useQuery();

  const regenerate = useCallback(() => {
    void utils.containers.getRandomName.invalidate();
  }, [utils]);


  return { randomName, regenerate };
};
