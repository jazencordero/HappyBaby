import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "@/components/shared/user-menu";

export async function AppHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b bg-background/80">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <Link href={user ? "/dashboard" : "/"} className="font-semibold">
          HappyBaby
        </Link>
        {user && (
          <UserMenu
            displayName={
              (user.user_metadata?.display_name as string) || user.email || ""
            }
          />
        )}
      </div>
    </header>
  );
}
