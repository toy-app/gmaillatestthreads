var models = {};

// Our base model is "person"
models.Person = Backbone.Model.extend({

  // Example of how to do a validation in a model
  validate: function(attributes) {
    if (typeof attributes.firstname !== 'string') {
      // Return a failed validation
      return 'Firstname is mandatory';
    }
    if (typeof attributes.lastname !== 'string') {
      // Return a failed validation
      return 'Lastname is mandatory';
    }
    // All validations passed, don't return anything
  }

});

// People collection
models.People = Backbone.Collection.extend({
  model: models.Person
});

// Router is responsible for driving the application. Usually
// this means populating the necessary data into models and
// collections, and then passing those to be displayed by
// appropriate views.
var Router = Backbone.Router.extend({
  routes: {
    '': 'index'  // At first we display the index route
  },

  index: function() {
    // Initialize a list of people
    // In this case we provide an array, but normally you'd
    // instantiate an empty list and call people.fetch()
    // to get the data from your backend
    var people = new models.People([
      {
        firstname: 'Arthur',
        lastname: 'Dent'
      },
      {
        firstname: 'Ford',
        lastname: 'Prefect'
      }
      ]);

    // Pass the collection of people to the view
    var view = new views.People({
      collection: people
    });

    // And render it
    view.render();

    // Example of adding a new person afterwards
    // This will fire the 'add' event in the collection
    // which causes the view to re-render
    people.add([
        {
          firstname: 'Zaphod',
          lastname: 'Beeblebrox'
        }
        ]);
  }
});

jQuery(document).ready(function() {
  // When the document is ready we instantiate the router
  var router = new Router();

  // And tell Backbone to start routing
  Backbone.history.start();
});



// Views are responsible for rendering stuff on the screen (well,
// into the DOM).
//
// Typically views are instantiated for a model or a collection,
// and they watch for change events in those in order to automatically
// update the data shown on the screen.
var views = {};

views.PeopleItem = Backbone.View.extend({
  // Each person will be shown as a table row
  tagName: 'tr',

  initialize: function(options) {
    // Ensure our methods keep the `this` reference to the view itself
    _.bindAll(this, 'render');

    // If the model changes we need to re-render
    this.model.bind('change', this.render);
  },

  render: function() {
    // Clear existing row data if needed
    jQuery(this.el).empty();

    // Write the table columns
    jQuery(this.el).append(jQuery('<td>' + this.model.get('firstname') + '</td>'));
    jQuery(this.el).append(jQuery('<td>' + this.model.get('lastname') + '</td>'));

    return this;
  }
});

views.People = Backbone.View.extend({
  // The collection will be kept here
  collection: null,

  // The people list view is attached to the table body
  el: 'tbody',

  initialize: function(options) {
    this.collection = options.collection;

    // Ensure our methods keep the `this` reference to the view itself
    _.bindAll(this, 'render');

    // Bind collection changes to re-rendering
    this.collection.bind('reset', this.render);
    this.collection.bind('add', this.render);
    this.collection.bind('remove', this.render);
  },

  render: function() {
    var element = jQuery(this.el);
    // Clear potential old entries first
    element.empty();

    // Go through the collection items
    this.collection.forEach(function(item) {

      // Instantiate a PeopleItem view for each
      var itemView = new views.PeopleItem({
        model: item
      });

      // Render the PeopleView, and append its element
      // to the table
      element.append(itemView.render().el);
    });

    return this;
  }
});