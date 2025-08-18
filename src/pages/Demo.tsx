import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import mobileMatrixDemo from '@/assets/mobile-matrix-demo.jpg';
import mobileComparisonDemo from '@/assets/mobile-comparison-demo.jpg';

const Demo = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 1rem)' }}>
      <div className="max-w-4xl mx-auto">
        <Link to="/history" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
          חזרה להיסטוריה
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-800 mb-2">דוגמה ויזואלית - מטריצת ניחושים במובייל</h1>
          <p className="text-gray-600">איך המטריצה תיראה במסך מובייל</p>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">מטריצה במובייל - תצוגה יחידה</h2>
            <div className="flex justify-center">
              <img 
                src={mobileMatrixDemo} 
                alt="דוגמה של מטריצת ניחושים במובייל" 
                className="max-w-full h-auto rounded-lg border shadow-md"
                style={{ maxWidth: '300px' }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-4 text-center">
              כפי שרואים - המטריצה תהיה צפופה מאוד במובייל עם 7 עמודות
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">השוואה: תצוגה נוכחית מול מטריצה</h2>
            <div className="flex justify-center">
              <img 
                src={mobileComparisonDemo} 
                alt="השוואה בין התצוגה הנוכחית למטריצה" 
                className="max-w-full h-auto rounded-lg border shadow-md"
              />
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">תצוגה נוכחית (שמאל)</h3>
                <ul className="text-green-700 space-y-1">
                  <li>✓ קריאה נוחה במובייל</li>
                  <li>✓ מידע ברור ומסודר</li>
                  <li>✓ אין צורך בגלילה אופקית</li>
                  <li>✓ טקסט בגודל נוח</li>
                </ul>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-2">מטריצה (ימין)</h3>
                <ul className="text-red-700 space-y-1">
                  <li>✗ צפופה מדי במובייל</li>
                  <li>✗ שמות קטנים ולא קריאים</li>
                  <li>✗ צורך בגלילה אופקית</li>
                  <li>✗ קשה לקריאה ושימוש</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">המלצה</h3>
            <p className="text-blue-700">
              כדאי להשאיר את התצוגה הנוכחית של המחזור הנוכחי כפי שהיא - מותאמת מצוין למובייל. 
              המטריצה מתאימה יותר לעמוד ההיסטוריה שם משתמשים מעוניינים לצפות בנתונים מפורטים יותר במסך גדול.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Demo;