package com.insureinspect.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "room_locations")
public class RoomLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String uuid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_visit_id", nullable = false)
    @JsonIgnore
    private SiteVisit siteVisit;

    private String roomType;
    private String dimensions;

    @Column(length = 2000)
    private String details;

    @OneToMany(mappedBy = "roomLocation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PhotoNote> photoNotes = new ArrayList<>();

    @OneToMany(mappedBy = "roomLocation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Equipment> equipments = new ArrayList<>();

    @OneToMany(mappedBy = "roomLocation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InventoryItem> inventoryItems = new ArrayList<>();

    public RoomLocation() {}

    public RoomLocation(SiteVisit siteVisit, String uuid, String roomType) {
        this.siteVisit = siteVisit;
        this.uuid = uuid;
        this.roomType = roomType;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUuid() {
        return uuid;
    }

    public void setUuid(String uuid) {
        this.uuid = uuid;
    }

    public SiteVisit getSiteVisit() {
        return siteVisit;
    }

    public void setSiteVisit(SiteVisit siteVisit) {
        this.siteVisit = siteVisit;
    }

    public String getRoomType() {
        return roomType;
    }

    public void setRoomType(String roomType) {
        this.roomType = roomType;
    }

    public String getDimensions() {
        return dimensions;
    }

    public void setDimensions(String dimensions) {
        this.dimensions = dimensions;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public List<PhotoNote> getPhotoNotes() {
        return photoNotes;
    }

    public void setPhotoNotes(List<PhotoNote> photoNotes) {
        this.photoNotes = photoNotes;
    }

    public List<Equipment> getEquipments() {
        return equipments;
    }

    public void setEquipments(List<Equipment> equipments) {
        this.equipments = equipments;
    }

    public void addPhotoNote(PhotoNote photoNote) {
        photoNotes.add(photoNote);
        photoNote.setRoomLocation(this);
    }

    public void addEquipment(Equipment equipment) {
        equipments.add(equipment);
        equipment.setRoomLocation(this);
    }

    public List<InventoryItem> getInventoryItems() {
        return inventoryItems;
    }

    public void setInventoryItems(List<InventoryItem> inventoryItems) {
        this.inventoryItems = inventoryItems;
    }

    public void addInventoryItem(InventoryItem inventoryItem) {
        inventoryItems.add(inventoryItem);
        inventoryItem.setRoomLocation(this);
    }
}
