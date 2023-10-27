var AutoBuy = {};

// Computes the cps and how much it boosts other Buildings
function CPSperBuilding() {
    var buildings = {};
    for (const [building, me] of Object.entries(Game.Objects)) {
        // Ripped straight out of the source code.
        // There was a comment that said the math might be off though
        if (me.amount > 0) {
            var synergiesWith = {};
            var synergyBoost = 0;

            if (me.name == 'Grandma') {
                for (var i in Game.GrandmaSynergies) {
                    if (Game.Has(Game.GrandmaSynergies[i])) {
                        var other = Game.Upgrades[Game.GrandmaSynergies[i]].buildingTie;
                        var mult = me.amount * 0.01 * (1 / (other.id - 1));
                        var boost = (other.storedTotalCps * Game.globalCpsMult) - (other.storedTotalCps * Game.globalCpsMult) / (1 + mult);
                        synergyBoost += boost;
                        if (!synergiesWith[other.plural]) synergiesWith[other.plural] = 0;
                        synergiesWith[other.plural] += mult;
                    }
                }
            }
            else if (me.name == 'Portal' && Game.Has('Elder Pact')) {
                var other = Game.Objects['Grandma'];
                var boost = (me.amount * 0.05 * other.amount) * Game.globalCpsMult;
                synergyBoost += boost;
                if (!synergiesWith[other.plural]) synergiesWith[other.plural] = 0;
                synergiesWith[other.plural] += boost / (other.storedTotalCps * Game.globalCpsMult);
            }

            for (var i in me.synergies) {
                var it = me.synergies[i];
                if (Game.Has(it.name)) {
                    var weight = 0.05;
                    var other = it.buildingTie1;
                    if (me == it.buildingTie1) { weight = 0.001; other = it.buildingTie2; }
                    var boost = (other.storedTotalCps * Game.globalCpsMult) - (other.storedTotalCps * Game.globalCpsMult) / (1 + me.amount * weight);
                    synergyBoost += boost;
                    if (!synergiesWith[other.plural]) synergiesWith[other.plural] = 0;
                    synergiesWith[other.plural] += me.amount * weight;
                }
            }

            buildings[building] = (me.storedTotalCps / me.amount) * Game.globalCpsMult + synergyBoost / me.amount;
        } else buildings[building] = 0;
    }
    return buildings;
}

// Computes the cps per cookie spent for every building
function CPSPCperBuilding() {
    var buildings = {};
    for (const [building, me] of Object.entries(Game.Objects)) {
        // Ripped straight out of the source code.
        // There was a comment that said the math might be off though
        if (me.amount > 0) {
            var synergiesWith = {};
            var synergyBoost = 0;

            if (me.name == 'Grandma') {
                for (var i in Game.GrandmaSynergies) {
                    if (Game.Has(Game.GrandmaSynergies[i])) {
                        var other = Game.Upgrades[Game.GrandmaSynergies[i]].buildingTie;
                        var mult = me.amount * 0.01 * (1 / (other.id - 1));
                        var boost = (other.storedTotalCps * Game.globalCpsMult) - (other.storedTotalCps * Game.globalCpsMult) / (1 + mult);
                        synergyBoost += boost;
                        if (!synergiesWith[other.plural]) synergiesWith[other.plural] = 0;
                        synergiesWith[other.plural] += mult;
                    }
                }
            }
            else if (me.name == 'Portal' && Game.Has('Elder Pact')) {
                var other = Game.Objects['Grandma'];
                var boost = (me.amount * 0.05 * other.amount) * Game.globalCpsMult;
                synergyBoost += boost;
                if (!synergiesWith[other.plural]) synergiesWith[other.plural] = 0;
                synergiesWith[other.plural] += boost / (other.storedTotalCps * Game.globalCpsMult);
            }

            for (var i in me.synergies) {
                var it = me.synergies[i];
                if (Game.Has(it.name)) {
                    var weight = 0.05;
                    var other = it.buildingTie1;
                    if (me == it.buildingTie1) { weight = 0.001; other = it.buildingTie2; }
                    var boost = (other.storedTotalCps * Game.globalCpsMult) - (other.storedTotalCps * Game.globalCpsMult) / (1 + me.amount * weight);
                    synergyBoost += boost;
                    if (!synergiesWith[other.plural]) synergiesWith[other.plural] = 0;
                    synergiesWith[other.plural] += me.amount * weight;
                }
            }

            buildings[building] = ((me.storedTotalCps / me.amount) * Game.globalCpsMult + synergyBoost / me.amount) / me.getPrice();
        } else buildings[building] = 0;
    }
    return buildings;
}

function BuyOptimalBuilding() {
    var buildings = CPSPCperBuilding();
    var optimal = "";
    var optimalCPSPC = 0;
    for (const [building, CPSPC] of Object.entries(buildings)) {
        if (CPSPC > optimalCPSPC) {
            optimal = building;
            optimalCPSPC = CPSPC;
        }
    }
    console.log(optimal)
    var optimalObject = Game.Objects[optimal];
    if (optimalObject.getPrice() <= Game.cookies) {
        optimalObject.buy(1);
        console.log("buying")
    }
}

AutoBuy.init = function () {
    Game.registerHook('logic', () => {
        BuyOptimalBuilding();
    })
}

Game.registerMod("AutoBuy", AutoBuy);