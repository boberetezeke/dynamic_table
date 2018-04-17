Dynamic Table Gem

This gem allows the user to create a dynamic searcable/sortable table without having to
create extra files and learn extra ways of doing things outside
of doing regular rails static tables.

In order to accomplish this, this gem relies on another gem that you must be using to 
be able to use this: **turbograft**. Turbograft is a hard fork of the **turbolinks** 
gem and it allows you to generate a page as normal and replace just parts of it.

To install it, add this to your Gemfile and bundle install.

```
gem 'dynamic_table'
```

To show how to use it, I will present a standard rails table view and show how it
would be modified to add searching and sorting. Here is the starting view.

```erbruby
<table>
<thead>
  <th>Name</th>
  <th>Color</th>
  <th>Actions</th>
</thead>
<tbody>
  <% @widgets.each do |widget| %>
    <td><%= @widget.name %></td>
    <td><%= @widget.color %></td>
    <td><%= link_to("Delete", widget_path(widget), method: :delete) %></td>
  <% end %>
</tbody>
</table>

<%= will_paginate(@widgets) %>
```

To use it in a view, you wrap your table in a block like so:

```erbruby
<% DynamicTable.new(view: self, base_path: widgets_path, filters: Widget::TABLE_FILTERS, params: params) do |dt| %>
  Search: <%= text_field_tag(:search) %>
  Filter: <%= dt.select_tag_options_for_select(:widget_color, Widget::WIDGET_COLORS_HASH) %>
  <table>
    <thead>
      <th><%= dt.sort_link_to("Name", :name) %></th>
      <th><%= dt.sort_link_to("Color", :color) %></th>
      <th>Action</th>
      <th>Color</th>
    </thead>
    <%= dt.refreshable_tag(:tbody, "body") do %>
      <% @widgets.each do |widget| %>
        <td><%= @widget.name %></td>
        <td><%= @widget.color %></td>
        <td><%= link_to("Delete", widget_path(widget), method: :delete) %></td>
      <% end %>
    <% end %>
  </table>

  <%= dt.refreshable_tag(:div, "pagination") do %>
    <%= will_paginate(@widgets) %>
  <% end %>
<% end %>
```

To go with that, you need to define a table of filters that are referenced in the DynamicTable argument.

```ruby
class Widget
  # this defines which colors to filter by
  COLORS_HASH = {
    "Blue" => :blue,
    "Red" => :red,
    "Green" => :green 
  } 
  
  SORTS_HASH = {
    "Name" => :name,
    "Color" => :color
  }
  SORTS = SORTS_HASH.values.map(&:to_s)

  SORT_DIRS_HASH = {
    "Ascending" => :asc,
    "Descending" => :desc,
  }
  SORT_DIRS = SORT_DIRS_HASH.values.map(&:to_s)

  # This defines the names of the filters and their default values
  TABLE_FILTERS = {
    search: '',
    widget_color: 'red'
    sort_by: 'name',
    sort_dir: 'asc'
  }
end
```

Lastly you then need to modify your controller's index method to respond to the params. Below I show
the original controller for the static table.

```ruby
class WidgetController < ApplicationController
  def index
    @widgets = Widget.all.paginate(page: params[:page], per_page: per_page)
  end
end
````

Then how the controller is modified to support the dynamic table.

```ruby
class WidgetController < ApplicationController
  def index
    @widgets = Widget.all.paginate(page: params[:page], per_page: per_page)
    
    @widgets = @widgets.where("name like '%#{connection.quote(search)[1..-2]}%'") if params[:search]
    @widgets = @widgets.where(color: params[:color]) if params[:color] && Widget::COLORS_HASH.invert.include?(params[:color])
    
    if params[:sort_by] && Widget::SORTS.include?(params[:sort_by])
      sort_by = params[:sort_by]
    else
      sort_by = :name
    end
    if params[:sort_dir] && Widget::SORT_DIRS.include?(params[:sort_dir])
      sort_dir = params[:sort_dir]
    else
      sort_dir = "asc"
    end
    
    @widgets = @widgets.order("#{sort_by} #{sort_dir}")
  end
end
````

As a result of all of this you have some fairly simple additions to your code and a nice URL for
sorting and searching (whose param names are up to you).


