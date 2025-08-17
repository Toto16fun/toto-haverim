import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 1rem)' }}>
      <div className="container mx-auto max-w-4xl">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-primary">
              Privacy Policy – "Toto Haverim"
            </CardTitle>
            <p className="text-muted-foreground">Updated: 17/08/2025</p>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">Data Collection</h2>
                <p>
                  We collect login details (email/username via Supabase) and in-app usage 
                  (predictions, results, points).
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Data Usage</h2>
                <p>
                  Data is used to operate the app (rounds, leaderboards, history) and for support.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Data Storage and Sharing</h2>
                <p>
                  Data is stored on Supabase. We don't sell data and only share with 
                  infrastructure providers required to run the service. No ad tracking SDKs.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Data Access and Deletion</h2>
                <p>
                  For data access/deletion requests, contact: 
                  <a 
                    href="mailto:tomercohen1995@gmail.com" 
                    className="text-primary hover:underline ml-1"
                  >
                    tomercohen1995@gmail.com
                  </a>
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;