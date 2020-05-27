
var travelApp = angular.module('travelApp', ['ngRoute', 'ui.bootstrap']);

travelApp.config(function($routeProvider) {
    $routeProvider

        .when('/', {
            templateUrl : 'pages/home.html',
            controller  : 'mainCtrl'
        })
        .when('/hotels', {
            templateUrl : 'pages/hotel-search.html',
            controller  : 'hotelSearchCtrl'
        })
        .when('/hotels/:hotelId', {
            templateUrl : 'pages/hotel.html',
            controller  : 'hotelCtrl'
        })
        .when('/flights', {
            templateUrl : 'pages/flights.html',
            controller  : 'flightsCtrl'
        });
});


travelApp.controller('mainCtrl', ['$scope', '$http', function($scope, $http) {

  $scope.hotels = [ ];
  $http.get('hotels.json').success(function(data) {
      $scope.hotels = data;
  });
}]);

travelApp.controller('hotelSearchCtrl', ['$scope', '$routeParams', function($scope, $routeParams) {

  const DEFAULT_CHECKIN_OFFSET_SECONDS = 24*60*60*1000; // 1 day
  const DEFAULT_CHECKOUT_OFFSET_SECONDS = 7*24*60*60*1000; // 1 week
  const DEFAULT_ADULTS = 2;
  const MAX_TRAVELERS = 8;

  // Get all distinct cities for the dropdown from the hotel list
  var unique = {};
  var distinct = [];
  $scope.hotels.forEach(function (hotel) {
    if (!unique[hotel.city]) {
      distinct.push(hotel.city);
      unique[hotel.city] = true;
    }
  });
  $scope.cities = distinct.sort();

  $scope.travelersChoices = new Array(MAX_TRAVELERS);
  for (var i = 0; i < MAX_TRAVELERS; i++) {
    $scope.travelersChoices[i] = i + 1;
  }

  $scope.selectAdults = function(num) { $scope.selectedAdults = num;};

  $scope.createSearchFromRouteParams = function() {
    var isValidSearch = true;

    // Get selected city from URL (if available)
    if ($routeParams.city) {
      $scope.selectedCity = $routeParams.city;
    } else {
      isValidSearch = false;
    }

    //Use dafaults if no checkin date provided in URL parameters
    if ($routeParams.checkin) {
      $scope.selectedCheckin = new Date($routeParams.checkin);
    } else {
      //Tomorrow
      $scope.selectedCheckin = new Date(Date.now() + DEFAULT_CHECKIN_OFFSET_SECONDS);
      isValidSearch = false;
    }
    if ($routeParams.checkout) {
      $scope.selectedCheckout = new Date($routeParams.checkout);
    } else {
      // One week from checkin date
      $scope.selectedCheckout = new Date($scope.selectedCheckin.valueOf() + DEFAULT_CHECKOUT_OFFSET_SECONDS);
      isValidSearch = false;
    }

    // Use default if number of adults not provided in URL parameters
    if ($routeParams.adults) {
      $scope.selectedAdults = $routeParams.adults;
    } else {
      $scope.selectedAdults = DEFAULT_ADULTS;
      isValidSearch = false;
    }

    // Create search object if all the necessary parameters have been provided
    if (isValidSearch) {
      // Create filter for search results listing
      var filter = {city: $scope.selectedCity};

      $scope.search = {
        city: $scope.selectedCity,
        checkin: $scope.selectedCheckin,
        checkout: $scope.selectedCheckout,
        adults: $scope.selectedAdults,
        filter: filter
      }
    }
  }

  $scope.createSearchFromRouteParams();

  // When the user has searched for hotels, send DAT Search event in Facebook pixel
  if ($scope.search) {
    fbq('track', 'Search', {
    content_type: 'hotel',
    // content_ids: TODO: first 3 IDs from search results,
    checkin_date: $scope.search.checkin.toISOString().substring(0, 10),
    checkout_date: $scope.search.checkout.toISOString().substring(0, 10),
    destination: $scope.search.city,
    city: $scope.search.city,
    // region: TODO: region from selected city,
    // country: TODO: country from selected country,
    num_adults: $scope.search.adults
    });
  }
}]);

travelApp.controller('hotelCtrl', ['$scope', '$routeParams', '$filter', function($scope, $routeParams, $filter) {
  // Get the right hotel object based on URL
  $scope.hotel = $filter('filter')($scope.hotels, function (hotel) {return String(hotel.hotelid) === $routeParams.hotelId;})[0];

  $scope.checkin = new Date($routeParams.checkin);
  $scope.checkout = new Date($routeParams.checkout);
  $scope.adults = $routeParams.adults;

  // Build an array for ngRepeat
  $scope.starsArray = new Array($scope.hotel.starrating);

  // Send DAT ViewContent event in Facebook pixel
  fbq('track', 'ViewContent', {
  content_type: 'hotel',
  content_ids: $scope.hotel.hotelid,
  checkin_date: $scope.checkin.toISOString().substring(0, 10),
  checkout_date: $scope.checkout.toISOString().substring(0, 10),
  destination: $scope.hotel.neighborhood + ', ' + $scope.hotel.city + ', ' + $scope.hotel.region + ', ' + $scope.hotel.country,
  city: $scope.hotel.city,
  region: $scope.hotel.region,
  country: $scope.hotel.country,
  num_adults: $scope.adults
  });

}]);

travelApp.controller('flightsCtrl', ['$scope',  function($scope) {
}]);
