import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Support = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 1rem)' }}>
      <div className="container mx-auto max-w-4xl">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-primary">
              Support - "Toto Haverim"
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <div className="space-y-6">
              <p>
                For any question, request, or issue related to "Toto Haverim", please contact us:
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">• Support email:</span>
                  <a 
                    href="mailto:tomercohen1995@gmail.com" 
                    className="text-primary hover:underline"
                  >
                    tomercohen1995@gmail.com
                  </a>
                </div>
                <div>
                  <span className="font-semibold">• Hours:</span> Sun–Thu, 10:00–18:00 (UK Time Zone)
                </div>
              </div>

              <section>
                <h2 className="text-xl font-semibold mb-3">When reporting an issue, please include:</h2>
                <ul className="space-y-2">
                  <li>• Device model (e.g., iPhone 14 Pro)</li>
                  <li>• iOS version (e.g., iOS 18.6)</li>
                  <li>• A short description of the problem</li>
                  <li>• Screenshots or screen recording (if possible)</li>
                </ul>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Support;