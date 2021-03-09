//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-nick:nicksim1994@cluster0.jptuh.mongodb.net/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});

//itemsSchema maps to the mongoDB collection - collection within db todolistDB is names items
const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist1!"
});

const item2 = new Item({
  name: "Welcome to your todolist2!"
});

const item3 = new Item({
  name: "Welcome to your todolist3!"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


//const items = ["Buy Food", "Cook Food", "Eat Food"];
//const workItems = [];

app.get("/", function(req, res) {

//const day = date.getDate();
  Item.find({}, function(err, foundItems){
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to DB.")
        }
      });
      res.redirect("/");
    }else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err){
        console.log("Successfully deleted checked Item");
        res.redirect("/");
      }
    });
  } else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
    });
  }



});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, function(err, foundList){
      if (!err){
        if (!foundList){
          //List does not exist - Create a new list
          const list = new List({
            name: customListName,
            items: defaultItems
          });
          //console.log("was saved successfully"); loop testing
          //debug- seems like js executes statements before finishes
          //timeout on redirect
          list.save(function(){

            res.redirect("/" + customListName);

          });
          console.log("Custom Name -", customListName, "- has been successfully added");
        }
        else{
          //List exists - Show the existing list
          res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
          console.log("Custom Name-", customListName , "- exists and has NOT been added");
        }
      }
      //console.log(foundList.name + " this is foundList query");
    });
});


app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started on successfully");
});
