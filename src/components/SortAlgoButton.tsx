import { ClockIcon, FlameIcon, NorthStarIcon } from "@primer/octicons-react";
import { useRouter } from "next/router";
import { useCallback, useState } from "react";
import { setCookie } from "../client/cookie";
import { useModal } from "../client/hooks";
import { Cookie } from "../common/constants";
import { SortAlgo } from "../common/model";
import { ButtonOption, ButtonSmall } from "./Button";
import { Modal } from "./Modal";

/** Pops up a modal to choose how the main feed is sorted. */
export function SortAlgoButton({ sortAlgo }: { sortAlgo: SortAlgo }) {
  const [isOpen, show, hide] = useModal();
  const [algo, setAlgoState] = useState<SortAlgo>(sortAlgo);

  const router = useRouter();
  const setAndReload = useCallback(
    async (a: SortAlgo) => {
      setAlgoState(a);
      setCookie(Cookie.SortAlgo, a);
      console.log("Sort changed, reloading. New sort " + a);
      router.reload();
    },
    [router]
  );

  return (
    <>
      {isOpen && (
        <Modal onClose={hide} title="Sort Feed">
          <SortAlgoScreen {...{ algo, setAlgo: setAndReload }} />
        </Modal>
      )}
      <ButtonSmall
        onClick={show}
        size="w-10 h-8 flex justify-center items-center"
      >
        <SortIcon algo={algo} />
      </ButtonSmall>
    </>
  );
}

function SortAlgoScreen(p: { algo: SortAlgo; setAlgo: (a: SortAlgo) => void }) {
  const opts: SortAlgo[] = ["hot", "latest"];

  return (
    <div className="w-full flex flex-col gap-1">
      {opts.map((o) => (
        <SortAlgoOpt key={o} option={o} {...p} />
      ))}
    </div>
  );
}

function SortAlgoOpt({
  option,
  algo,
  setAlgo,
}: {
  option: SortAlgo;
  algo: SortAlgo;
  setAlgo: (a: SortAlgo) => void;
}) {
  const onClick = useCallback(
    () => algo !== option && setAlgo(option),
    [algo, option, setAlgo]
  );

  const [name, desc] = getSortNameDesc(option);
  return (
    <ButtonOption
      disabled={algo === option}
      onClick={onClick}
      size="w-full h-16 flex gap-8 items-center"
    >
      <div />
      <SortIcon algo={option} />
      <div className="w-64 flex flex-col items-start text-base leading-tight gap-1">
        <div className="font-bold">{name}</div>
        <div className="font-normal">{desc}</div>
      </div>
    </ButtonOption>
  );
}

function getSortNameDesc(algo: SortAlgo) {
  switch (algo) {
    case "hot":
      return ["Best", "A balance of recent and popular"];
    case "latest":
      return ["Latest", "Most recent posts first"];
    default:
      return ["Custom", "Define your own feed"];
  }
}

function SortIcon({ algo }: { algo: SortAlgo }) {
  switch (algo) {
    case "hot":
      return <FlameIcon />;
    case "latest":
      return <ClockIcon />;
    default:
      return <NorthStarIcon />;
  }
}
