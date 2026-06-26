package com.insureinspect.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "compliance_forms")
public class ComplianceForm {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String uuid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_visit_id", nullable = false)
    @JsonIgnore
    private SiteVisit siteVisit;

    private String formType;
    private boolean preExistingDamage;
    private boolean safetyCheckPassed;
    private boolean customerAuthorized;
    private String authorizedSignatureName;

    public ComplianceForm() {}

    public ComplianceForm(SiteVisit siteVisit, String uuid, String formType) {
        this.siteVisit = siteVisit;
        this.uuid = uuid;
        this.formType = formType;
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

    public String getFormType() {
        return formType;
    }

    public void setFormType(String formType) {
        this.formType = formType;
    }

    public boolean isPreExistingDamage() {
        return preExistingDamage;
    }

    public void setPreExistingDamage(boolean preExistingDamage) {
        this.preExistingDamage = preExistingDamage;
    }

    public boolean isSafetyCheckPassed() {
        return safetyCheckPassed;
    }

    public void setSafetyCheckPassed(boolean safetyCheckPassed) {
        this.safetyCheckPassed = safetyCheckPassed;
    }

    public boolean isCustomerAuthorized() {
        return customerAuthorized;
    }

    public void setCustomerAuthorized(boolean customerAuthorized) {
        this.customerAuthorized = customerAuthorized;
    }

    public String getAuthorizedSignatureName() {
        return authorizedSignatureName;
    }

    public void setAuthorizedSignatureName(String authorizedSignatureName) {
        this.authorizedSignatureName = authorizedSignatureName;
    }
}
