import React from "react";
import "./App.css";
import { Pos } from "./Pos";

import levelsData from "./levels.json";

const GRID_SIZE = 9;

function inGrid(p: Pos): boolean {
  return p.x >= 0 && p.y >= 0 && p.x < GRID_SIZE && p.y < GRID_SIZE;
}

type DivProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>;

function GridSlot({ pos, style, ...props }: { pos: Pos } & DivProps) {
  return (
    <div
      style={{
        position: "absolute",
        width: `${100 / GRID_SIZE}%`,
        height: `${100 / GRID_SIZE}%`,
        left: `${(pos.x * 100) / GRID_SIZE}%`,
        top: `${(pos.y * 100) / GRID_SIZE}%`,
        padding: 2,
        display: "flex",
        ...style,
      }}
      {...props}
    />
  );
}

function Firework({
  delay = 0,
  type = "poof",
}: {
  delay?: number;
  type?: "poof" | "implode";
}) {
  const refOuter = React.useRef<HTMLDivElement>(null as any);

  const color = type === "poof" ? "white" : "black";

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      refOuter.current.style.width = "120%";
      refOuter.current.style.height = "120%";
      refOuter.current.style.transform = "translate(-50%, -50%) scale(1, 1)";
    }, delay);

    return () => {
      clearTimeout(timeout);
    };
  }, [delay]);
  return (
    <>
      <div
        ref={refOuter}
        style={{
          zIndex: 99999,
          pointerEvents: "none",
          position: "absolute",
          left: "50%",
          top: "50%",
          width: "0",
          height: "0",
          border: `50px solid ${color}`,
          transform: "translate(-50%, -50%) scale(0, 0)",
          borderRadius: "50%",
          transition:
            "0.1s linear width, 0.1s linear height, 0.2s ease-out border, 0.1s transform linear",
        }}
        onTransitionEnd={() => {
          refOuter.current.style.border = `0 solid ${color}`;
          // refOuter.current.hidden = true;
        }}
      />
    </>
  );
}

function compatible(a: Tile, b: Tile): boolean {
  if ((a >= "0" && a <= "9") || (b >= "0" && b <= "9")) {
    return a === b;
  }
  return (
    (a.length > 1 && a.includes(b)) ||
    (b.length > 1 && b.includes(a)) ||
    (a.toLowerCase() === b.toLowerCase() && a !== b)
  );
}

function everyScoreMap(map: ReadonlyMap<Pos, Tile>): string {
  type Data = {
    randomWinChance: number;
  };
  const stateData = new Map<string, Data>();

  const keyFor = (has: ReadonlySet<Pos>) =>
    [...has]
      .map(p => p.toString())
      .sort()
      .join(";");

  stateData.set(keyFor(new Set()), {
    randomWinChance: 1,
  });

  const search = (has: ReadonlySet<Pos>): Data => {
    const key = keyFor(has);
    if (stateData.has(key)) {
      return stateData.get(key)!;
    }

    const free = [...has].filter(
      p => p.neighbors().filter(q => !has.has(q)).length >= LIBERTIES,
    );
    let options = 0;
    let totalProb = 0;
    for (const p of free) {
      for (const q of free) {
        if (p === q) {
          continue;
        }
        if (!compatible(map.get(p)!, map.get(q)!)) {
          continue;
        }

        const result = search(
          new Set([...has].filter(x => x !== p && x !== q)),
        );
        options += 1;
        totalProb += result.randomWinChance;
      }
    }

    const answer: Data = {
      randomWinChance: options ? totalProb / options : 0,
    };

    stateData.set(keyFor(has), answer);

    return answer;
  };
  const { randomWinChance } = search(new Set(map.keys()));

  return Math.floor(randomWinChance * 100).toString();
}

function Stone({
  style,
  active,
  tile,
  hidden,
  children,
  ...props
}: { tile: Tile; hidden: boolean; active: boolean } & DivProps) {
  return (
    <>
      <div
        style={{
          position: "relative",
          background: "#eee",
          aspectRatio: "1 / 1",
          flexGrow: 1,
          borderRadius: "25%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",

          ...(!active
            ? {
                opacity: 0.5,
              }
            : {
                cursor: "pointer",
                boxShadow: "0 3px 1px 1px rgba(0, 0, 0, 0.5)",
              }),

          ...(hidden ? { opacity: 0, pointerEvents: "none" } : {}),

          ...style,
        }}
        {...props}
      >
        {["a", "A"].includes(tile) && (
          <>
            <div
              style={{
                position: "absolute",
                left: "20%",
                top: "20%",
                right: "20%",
                bottom: "20%",
                background: "black",

                clipPath:
                  "polygon(5% 0%, 100% 0%, 100% 5%, 5% 100%, 0% 100%, 0% 5%)",

                transform: tile === "A" ? "rotate(180deg)" : "",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "28%",
                top: "28%",
                background: tile === "A" ? "black" : "white",
                width: "18%",
                height: "18%",
                aspectRatio: "1 / 1",
                borderRadius: "50%",
              }}
            />
          </>
        )}
        {["1", "2", "3"].includes(tile) && (
          <div
            style={{
              width: "50%",
              aspectRatio: "1 / 1",
              background: "black",
              borderRadius: 2,

              ...(tile === "1" ? { background: "red" } : {}),
              ...(tile === "2"
                ? { background: "#fcd12a", borderRadius: "50%" }
                : {}),
              ...(tile === "3"
                ? {
                    background: "var(--color2)",
                    transform: "rotate(45deg) scale(90%)",
                  }
                : {}),
            }}
          />
        )}

        {children}
      </div>
      {hidden && <Firework />}
    </>
  );
}

type Tile = "1" | "2" | "3" | "#" | "a" | "A";

function randIndex(n: number): number {
  return Math.floor(n * Math.random());
}
function randItem<T>(list: Iterable<T>): T {
  const options = [...list];
  return options[randIndex(options.length)];
}

const LIBERTIES = 3;

function generatePuzzle() {
  const map = new Map<Pos, Tile>();

  const pairs: (readonly [Tile, Tile])[] = [];
  for (const [t1, t2, count] of [
    ["1", "1", 5],
    ["2", "2", 4],
    ["3", "3", 3],
    ["a", "A", 2],
  ] as const) {
    const parts: [Tile, Tile][] = [];
    for (let i = 0; i < count; i++) {
      parts.push([t1, t2]);
    }
    pairs.push(...parts);
  }
  // Now, shuffle the pairs.
  for (let i = 0; i < pairs.length; i++) {
    // Unbiased Fisher-Yates shuffle:
    const j = randIndex(pairs.length - i);
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  // Now, place the pairs one-at-a-time.
  let gas = 10000;
  while (pairs.length > 0) {
    gas -= 1;
    if (gas < 0) {
      throw new Error("out of gas");
    }
    const current = pairs.pop()!;

    const candidates = new Set<Pos>();

    for (const p of map.keys()) {
      for (const n of p.neighbors()) {
        if (inGrid(n)) {
          candidates.add(n);
        }
      }
    }
    for (const p of map.keys()) {
      candidates.delete(p);
    }

    if (candidates.size === 0) {
      const initial = new Pos(
        Math.floor(Math.random() * (GRID_SIZE - 2)) + 1,
        Math.floor(Math.random() * (GRID_SIZE - 2)) + 1,
      );
      candidates.add(initial);
      candidates.add(randItem(initial.neighbors()));
    }

    const openCount = (p: Pos): number => {
      return p.neighbors().filter(n => !map.has(n)).length;
    };

    const list = [...candidates].filter(p => openCount(p) >= LIBERTIES);

    const placeA = randItem(list);
    const placeB = randItem(list);
    if (
      placeA === placeB ||
      (placeA.distance(placeB) === 1 &&
        Math.min(openCount(placeA), openCount(placeB)) === LIBERTIES)
    ) {
      pairs.push(current);
      continue;
    }

    map.set(placeA, current[0]);
    map.set(placeB, current[1]);
  }

  return map;
}

type Level = {
  name: string;
  help?: string;
  levelData: {
    x: number;
    y: number;
    tile: Tile;
  }[];
};

const levels: Level[] = levelsData.map(level => {
  return {
    name: level.name,
    help: level.help,
    levelData: level.levelData.split(";").map(part => {
      if (part.length !== 3) {
        throw new Error("invalid level data");
      }
      return {
        x: parseInt(part[0], 10),
        y: parseInt(part[1], 10),
        tile: part[2] as Tile,
      };
    }),
  };
});

function serializeGameState(gameState: GameState): Level {
  return {
    name: gameState.name,
    help: gameState.text,
    levelData: [...gameState.tiles].map(([{ x, y }, tile]) => ({ x, y, tile })),
  };
}

type GameState = {
  readonly name: string;
  readonly tiles: ReadonlyMap<Pos, Tile>;
  text?: string;
};
type GameStateBuilder = {
  readonly name: string;
  tiles: Map<Pos, Tile>;
  text?: string;
};

function processLevelData(level: Level): GameState {
  const state: GameStateBuilder = {
    name: level.name,
    tiles: new Map(),
    text: level.help,
  };
  for (const { x, y, tile } of level.levelData) {
    state.tiles.set(new Pos(x, y), tile);
  }
  return state;
}

function App() {
  const [completed, setCompleted] = React.useState(() => {
    const saved: Set<string> = new Set(
      JSON.parse(window.localStorage.getItem("completed-levels") ?? "[]"),
    );
    if (!saved.has("Tutorial 4")) {
      saved.delete("Tutorial 1");
      saved.delete("Tutorial 2");
      saved.delete("Tutorial 3");
      saved.delete("Tutorial 4");
    }
    return saved;
  });

  React.useEffect(() => {
    window.localStorage.setItem(
      "completed-levels",
      JSON.stringify([...completed]),
    );
  });

  const [mode, setMode] = React.useState<"puzzle" | "levels">("puzzle");

  const [originalStones, setOriginalStones] = React.useState(() => {
    const firstLevel = levels.find(level => !completed.has(level.name));
    if (firstLevel) {
      return processLevelData(firstLevel);
    }
    return { tiles: generatePuzzle(), name: "Random" };
  });
  const [stones, setStonesUnderlying] = React.useState(originalStones);

  React.useEffect(() => {
    if (stones.tiles.size === 0 && !completed.has(stones.name)) {
      setCompleted(new Set([...completed, stones.name]));
    }
  });

  const [selected, setSelected] = React.useState<Pos | null>(null);
  const [lastClick, setLastClick] = React.useState(new Pos(0, 0));

  const [history, setHistory] = React.useState<typeof stones[]>([]);

  const setStones = (newStones: ReadonlyMap<Pos, Tile>) => {
    setStonesUnderlying({ ...stones, tiles: newStones });
    setHistory([...history, stones]);
  };

  const undo = (): void => {
    if (history.length === 0) {
      return;
    }
    setSelected(null);
    setStonesUnderlying(history[history.length - 1]);
    setHistory(history.slice(0, history.length - 1));
  };

  function startRandomGame(): void {
    setOriginalStones({ name: "Random", tiles: generatePuzzle() });
  }

  React.useLayoutEffect(() => {
    setHistory([]);
    setStonesUnderlying(originalStones);
  }, [originalStones]);

  function nextGame(): void {
    const nextLevel = levels.find(level => !completed.has(level.name));
    if (!nextLevel) {
      startRandomGame();
    } else {
      setOriginalStones(processLevelData(nextLevel));
    }
  }

  return (
    <div
      className="App"
      style={{
        transform: `rotateY(${
          mode === "puzzle" ? 0 : -180
        }deg) translateZ(50px)`,
        transition: "transform 0.5s",
        transformStyle: "preserve-3d",
      }}
    >
      <div className="app-background" />
      <div className="levels-background">
        {
          <button
            style={{
              position: "absolute",
              right: 30,
              top: 0,
              zIndex: 5,
              transform: "translate(0, -50%)",
            }}
            tabIndex={mode !== "levels" ? -1 : undefined}
            onClick={() => {
              setMode(mode === "puzzle" ? "levels" : "puzzle");
            }}
          >
            ⇩ back to {stones.name}
          </button>
        }
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            overflow: "scroll",
            padding: 20,
            borderRadius: 30,
          }}
        >
          <div
            style={{
              display: "grid",
              padding: 40,
              gridTemplateColumns: "repeat(auto-fit, minmax(60px, 1fr))",
              rowGap: "10px",
              columnGap: "10px",
              overflow: "scroll",
            }}
          >
            {levels.map(level => (
              <React.Fragment key={level.name + "///"}>
                {level.name.endsWith(" 1") && (
                  <div style={{ gridColumn: 1 }}>{level.name.slice(0, -2)}</div>
                )}
                <button
                  tabIndex={mode !== "levels" ? -1 : undefined}
                  style={{
                    fontSize: 35,
                    background: completed.has(level.name)
                      ? "var(--color5)"
                      : "var(--color1)",
                    aspectRatio: "1 / 1",
                    borderRadius: "10px",
                    display: "flex",
                    placeContent: "center",
                    placeItems: "center",

                    ...(level.name.endsWith(" 1") ? { gridColumn: "1" } : {}),
                  }}
                  onClick={() => {
                    setOriginalStones(processLevelData(level));
                    setMode("puzzle");
                  }}
                >
                  {level.name.replace(/[^\d]/g, "")}
                </button>
              </React.Fragment>
            ))}
            <div style={{ gridColumn: 1 }}>Random</div>
            <button
              tabIndex={mode !== "levels" ? -1 : undefined}
              style={{
                fontSize: 35,
                background: "var(--color5)",
                aspectRatio: "1 / 1",
                borderRadius: "10px",
                display: "flex",
                placeContent: "center",
                placeItems: "center",
                gridColumn: 1,
              }}
              onClick={() => {
                setOriginalStones({ name: "Random", tiles: generatePuzzle() });
                setMode("puzzle");
              }}
            >
              ∞
            </button>
          </div>
        </div>
      </div>
      {history.length > 0 && stones.tiles.size > 0 && (
        <button
          style={{
            position: "absolute",
            left: 30,
            bottom: 0,
            zIndex: 5,
            transform: "translate(0, 50%)",
          }}
          tabIndex={mode !== "puzzle" ? -1 : undefined}
          onClick={() => {
            undo();
          }}
        >
          ↩ Undo
        </button>
      )}
      {completed.has("Tutorial 4") && (
        <button
          style={{
            position: "absolute",
            right: 30,
            top: 0,
            zIndex: 5,
            transform: `translate(0, -50%)`,
            backfaceVisibility: "hidden",
          }}
          tabIndex={mode !== "puzzle" ? -1 : undefined}
          onClick={() => {
            setMode(mode === "puzzle" ? "levels" : "puzzle");
          }}
        >
          ⇪ {stones.name}
        </button>
      )}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          overflow: "hidden",
        }}
      >
        <button
          onClick={() => {
            if (stones.tiles.size !== 0) {
              return;
            }
            nextGame();
          }}
          style={{
            position: "absolute",
            left: "50%",
            top: stones.tiles.size === 0 ? "50%" : "-90px",
            transform: "translate(-50%, -50%)",
            fontSize: "200%",
            zIndex: 5,
            transition: "top  1s",
          }}
          tabIndex={stones.tiles.size === 0 ? 0 : -1}
        >
          Next
        </button>
      </div>

      <div
        style={{
          position: "relative",
          width: "100%",
          borderRadius: 20,
          height: "100%",
        }}
      >
        {stones.text && <div>{stones.text}</div>}
        {stones.tiles.size === 0 && (
          <>
            {new Array(GRID_SIZE).fill(null).flatMap((_, x) =>
              new Array(GRID_SIZE).fill(null).map((_, y) => (
                <GridSlot key={`${x};${y}`} pos={new Pos(x, y)}>
                  <Firework
                    delay={
                      Math.sqrt(
                        (x - lastClick.x) ** 2 + (y - lastClick.y) ** 2,
                      ) * 250
                    }
                  />
                </GridSlot>
              )),
            )}
          </>
        )}
        {[...originalStones.tiles].map(([p, tile]) => (
          <GridSlot key={p.toString()} pos={p}>
            <Stone
              hidden={!stones.tiles.has(p)}
              tile={tile}
              active={
                p.neighbors().filter(n => !stones.tiles.has(n)).length >=
                LIBERTIES
              }
              onClick={() => {
                setLastClick(p);
                if (
                  p.neighbors().filter(n => !stones.tiles.has(n)).length <
                  LIBERTIES
                ) {
                  setSelected(null);
                  return;
                }
                if (p === selected) {
                  setSelected(null);
                  return;
                }
                if (!selected) {
                  setSelected(p);
                  return;
                }
                if (
                  stones.tiles.has(selected) &&
                  compatible(stones.tiles.get(selected)!, tile)
                ) {
                  setStones(
                    new Map(
                      [...stones.tiles].filter(
                        q => q[0] !== selected && q[0] !== p,
                      ),
                    ),
                  );
                  setSelected(null);
                  return;
                }
                setSelected(p);
              }}
              style={{
                ...(selected === p
                  ? {
                      background: "var(--color4)",
                      transition: "border 0.1s",
                      border: "5px solid var(--color2)",
                    }
                  : {}),

                transition: "opacity 0.2s, box-shadow 0.2s",
              }}
            />
          </GridSlot>
        ))}
      </div>
    </div>
  );
}

export default App;
