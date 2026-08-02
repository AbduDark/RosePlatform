import ImgMohamed from "../assets/images/Mohamed-Gomaa.jpg";
import ImgAbdulRahman from "../assets/images/AbdulRahman-Sayed.jpg";
function TeamDeveloper() {
  return (
    <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pt-24">
      <div class="text-center mb-16">
        <h1 class="text-3xl md:text-3xl font-bold text-white mb-6 font-zs">
          فريق تصميم وتطوير الموقع الإلكتروني
        </h1>
        <div class="w-32 h-1 bg-gradient-to-r from-red-500 to-red-700 mx-auto mb-6"></div>
      </div>
      <div className="pb-24 grid grid-cols-1 md:grid-cols-2 gap-36 max-w-4xl mx-auto">
        <div
          onClick={() => {
            window.open("https://wa.me/201126576004", "_blank");
          }}
          className="cursor-pointer team-card group relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-2xl hover:shadow-red-500/20 transition-all duration-500 hover:-translate-y-2"
        >
          <div className="relative h-124 overflow-hidden">
            <img
              src={ImgMohamed}
              alt="Mohamed Gomaa"
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute bottom-4 right-4 z-20">
              <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-zs font-semibold shadow-lg">
                Front End Developer
              </span>
            </div>
          </div>
          <div className="p-6">
            <h3 className="text-2xl font-bold text-white mb-3 font-zs group-hover:text-secondary transition-colors">
              Mohamed Gomaa
            </h3>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-600/5 to-red-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        </div>
        <div
          onClick={() => {
            window.open("https://wa.me/201060339428", "_blank");
          }}
          className="cursor-pointer team-card group relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-2xl hover:shadow-red-500/20 transition-all duration-500 hover:-translate-y-2"
        >
          <div className="relative h-124 overflow-hidden">
            <img
              src={ImgAbdulRahman}
              alt="AbdulRahman Sayed"
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute bottom-4 right-4 z-20">
              <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-zs font-semibold shadow-lg">
                Back End Developer
              </span>
            </div>
          </div>
          <div className="p-6">
            <h3 className="text-2xl font-bold text-white mb-3 font-zs group-hover:text-secondary transition-colors">
              AbdulRahman Sayed
            </h3>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-600/5 to-red-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
}

export default TeamDeveloper;
