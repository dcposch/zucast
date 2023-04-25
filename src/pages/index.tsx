import { trpc } from "@/utils/trpc";

export default function IndexPage() {
  const result = trpc.greeting.useQuery({ name: "client" });

  if (!result.data) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <h1>Loading...</h1>
      </div>
    );
  }
  return (
    <div className="w-full h-full flex justify-center items-center">
      <h1>{result.data.ret}</h1>
    </div>
  );
}
