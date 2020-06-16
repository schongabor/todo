//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//database connection to mongodb atlas -- if the database didnt exists, it will create it (in this case the "todolistDB in the link")
mongoose.connect("mongodb+srv://username:password@clusterName-ul9ti.mongodb.net/nameOfDB?retryWrites=true&w=majority", {useNewUrlParser: true});

const itemSchema = {
  name: String
};

//this will create a "table" in the todolistDB with the name "items"
const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Hit the + button to add a new item."
});

const item2 = new Item({
  name: "<-- click the checkbox to delete an item."
});

const item3= new Item({
  name: "Type *home*/yourlist to add custom endpoints."
});

const listSchema = {
  name: String,
  items: [itemSchema]
};

//this will create a "table" in the todolistDB with the name "lists"
const List = mongoose.model("List", listSchema);

//default items array for starting
const defaultItems = [item1, item2, item3];

app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems){
    if(foundItems.length === 0){
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        } else {
          console.log("Default data added successfull");
        }
      });
      res.redirect("/");
    } else {
        res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

app.get("/:customListName", function(request, response){
  const customListName = _.capitalize(request.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
      if(!foundList){
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        response.redirect("/" + customListName);
      } else {
        response.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(!err){
        console.log("Succesfully deleted checked item!");
        res.redirect("/");
      }
    });
  } else {
      List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
    });
  }
});

app.get("/about", function(req, res){
  res.render("about");
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started succesfully");
});
