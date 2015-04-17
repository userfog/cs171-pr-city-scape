CS171 Design Studio
Apr 14, 2015

Our partners were: Dillon Tiner, Adam Gracia and Yinka Ogunbiyi.

They brought up some very good points/issues during their critique:

	- Could you compare crime statistics between two neighborhoods?

	- Can you track crime statistics through time?

	- Could you use radio buttons above the sunburst to modify the displayed data?

	- In the sunburst, does color corresponding to levels of hierarchy, or is it coded by some  other categorical variable?

We will try to address some of these points in our final implementation - we are considering the possibility of comparing two neighborhoods, although we are wary of information/feature overload. We do plan to implement a timeline to allow tracking of statistics through time. We will be using a user input to modify the year data in the sunburst, although probably in the form of a brushable timeline.

Their points on color in the sunburst were particulary useful - they helped us to realize that our initial iterations were confusing a bit misleading. Giving a large number of categories their own color is visually overwhelming and also not informative - the more important attribute is their depth in the hierarchy. Based on their input, we decided to use color to represent primary, secondary, and tertiary attributes instead of individual categories. 
